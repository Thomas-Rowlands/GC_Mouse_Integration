<?php
    include_once 'database.php';
    include_once 'studies.php';

    

    class Genome {

        private static $chromosomes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
        15, 16, 17, 18, 19, 20, 21, 22, "X", "Y"];
        /**
         * @var GC_Connection
         */
        private $con;
        /**
         * @var Neo_Connection
         */
        private $neo;
        /**
         * @var Ontology
         */
        private $ont;

        public function __construct()
        {
            $this->con = new GC_Connection("gc_mouse");
            $this->neo = new Neo_Connection();
            $this->ont = new Ontology();
        }

        public function getPhenotypeMarkerBins($termID, $searchOnt): array
        {
            if (!$termID || !$searchOnt)
                return [];
            if (strtoupper($searchOnt) !== "MESH") {
                $study = new StudySearch();
                $termID = $study->get_mesh_id_from_db($termID);
                if (!$termID)
                    return ["highest"=>null, "average"=>null, "bins"=>[]];
            }
            $descendants = $this->ont->get_term_descendants($termID, "MESH");
            $descendants[] = $termID;
            $result = ["highest"=>0, "average"=>0, "bins"=>[]];
            $term_string = "";
            foreach ($descendants as $descendant) {
                $term_string .= "'" . str_replace(" ", "", $descendant) . "',";
            }
            $term_string = rtrim($term_string, ",");

            $total = 0;

            foreach (Genome::$chromosomes as $chromosome) {
                $cmd = "SELECT '".$chromosome."' AS chr, bin, SUM(value) AS value, highest_significance
                FROM human_markers_chr".$chromosome." AS hm
                WHERE hm.mesh_id in (" . $term_string . ")
                GROUP BY hm.bin, hm.highest_significance
                ORDER BY hm.bin, hm.highest_significance ASC
                ";
                $markers_result = $this->con->execute($cmd, "gc_bin");
                if ($markers_result) {
                    $markers = mysqli_fetch_all($markers_result, MYSQLI_ASSOC);
                    foreach ($markers as $marker) {
                        $result["bins"][] = $marker;
                        $total += $marker["value"];
                        if ($marker["value"] > $result["highest"])
                            $result["highest"] = $marker["value"];
                    }

                }
            }

            if ($result["bins"])
                if (count($result["bins"]) > 0)
                    $result["average"] = $total / count($result["bins"]);


            return $result;
        }

        public function getInferredPhenotypeMarkerBins($termID, $searchOnt): array
        {
            if (!$termID || !$searchOnt)
                return [];

            if (strtoupper($searchOnt) !== "MESH") {
                $study = new StudySearch();
                $termID = $study->get_mesh_id_from_db($termID);
                if (!$termID)
                    return ["highest"=>null, "average"=>null, "bins"=>[]];
            }

            $mappedTerms = $this->ont->get_inferred_mappings($termID, "MP", $searchOnt);
            $mappedDescendants = [];
            foreach ($mappedTerms as $term) {
                $mappedDescendants[] = $term;
            }
            foreach($mappedTerms as $term) {
                $descendants = $this->ont->get_term_descendants($term, $searchOnt);
                foreach($descendants as $descendant)
                    $mappedDescendants[] = $descendant;
            }


            $result = ["highest"=>0, "average"=>0, "bins"=>[]];

            if (!$mappedDescendants)
                return $result;

            $term_string = "";
            foreach ($mappedDescendants as $term) {
                $term_string .= "'" . str_replace(" ", "", $term) . "',";
            }
            $term_string = rtrim($term_string, ",");
            $total = 0;

            foreach (Genome::$chromosomes as $chromosome) {
                $cmd = "SELECT '".$chromosome."' AS chr, bin, SUM(value) AS value, highest_significance
                FROM human_markers_chr".$chromosome." AS hm
                WHERE hm.mesh_id in (" . $term_string . ")
                GROUP BY hm.bin, hm.highest_significance
                ORDER BY hm.bin, hm.highest_significance ASC
                ";
                $markers_result = $this->con->execute($cmd, "gc_bin");
                if ($markers_result) {
                    $markers = mysqli_fetch_all($markers_result, MYSQLI_ASSOC);
                    foreach ($markers as $marker) {
                        $result["bins"][] = $marker;
                        $total += $marker["value"];
                        if ($marker["value"] > $result["highest"])
                            $result["highest"] = $marker["value"];
                    }

                }
            }

            if ($result["bins"])
                if (count($result["bins"]) > 0)
                    $result["average"] = $total / count($result["bins"]);


            return $result;
        }

        public function getMouseKnockoutBins($termID, $searchOnt): array
        {
            if (!$termID || !$searchOnt)
                return [];

            if (strtoupper($searchOnt) != "MP") {
                $termID = $this->ont->get_mp_mapping_by_id($termID);
                if (!$termID)
                    return ["highest"=>null, "average"=>null, "bins"=>[]];
                $termID = $termID[0]["mappedID"];
            }
            $descendants = $this->ont->get_term_descendants($termID, "MP");
            $result = ["highest"=>0, "average"=>0, "bins"=>[]];
            $term_string = "";
            foreach ($descendants as $descendant) {
                $term_string .= "'" . str_replace(" ", "", $descendant) . "',";
            }
            $term_string .= "'" . str_replace(" ", "", $termID) . "',";
            $term_string = rtrim($term_string, ",");

            $total = 0;
            $used_bin_count = 0;
            foreach (Genome::$chromosomes as $chromosome) {
                $cmd = "SELECT '".$chromosome."' AS chr, bin, SUM(value) AS value, highest_significance
                FROM mouse_knockouts_chr".$chromosome." AS mk
                WHERE mk.mp_id in (" . $term_string . ")
                GROUP BY mk.bin, mk.highest_significance
                ";
                $markers_result = $this->con->execute($cmd, "gc_bin");
                if ($markers_result) {
                    $markers = mysqli_fetch_all($markers_result, MYSQLI_ASSOC);
                    foreach ($markers as $marker) {
                        $result["bins"][] = $marker;
                        $total += $marker["value"];
                        if ($marker["value"] > 0)
                            $used_bin_count += 1;
                        if ($marker["value"] > $result["highest"])
                            $result["highest"] = $marker["value"];
                    }

                }
            }
            if ($result["bins"])
                if ($used_bin_count)
                    $result["average"] = $total / $used_bin_count;

            
            return $result;
        }

        public function getInferredMouseKnockoutBins($termID, $sourceOnt, $searchOnt): array
        {
            if (!$termID || !$searchOnt)
                return [];

            $mappedTerms = $this->ont->get_inferred_mappings($termID, $sourceOnt, $searchOnt);
            $mappedDescendants = [];
            foreach ($mappedTerms as $term) {
                $mappedDescendants[] = $term;
            }
            foreach($mappedTerms as $term) {
                $descendants = $this->ont->get_term_descendants($term, $searchOnt);
                foreach($descendants as $descendant)
                    $mappedDescendants[] = $descendant;
            }

            $result = ["highest"=>0, "average"=>0, "bins"=>[]];

            if (!$mappedDescendants)
                return $result;

            $term_string = "";
            foreach ($mappedDescendants as $term) {
                $term_string .= "'" . str_replace(" ", "", $term) . "',";
            }
            $term_string = rtrim($term_string, ",");
            $total = 0;
            $used_bin_count = 0;
            foreach (Genome::$chromosomes as $chromosome) {
                $cmd = "SELECT '".$chromosome."' AS chr, bin, SUM(value) AS value, highest_significance
                FROM mouse_knockouts_chr".$chromosome." AS mk
                WHERE mk.mp_id in (" . $term_string . ")
                GROUP BY mk.bin, mk.highest_significance
                ";
                $markers_result = $this->con->execute($cmd, "gc_bin");
                if ($markers_result) {
                    $markers = mysqli_fetch_all($markers_result, MYSQLI_ASSOC);
                    foreach ($markers as $marker) {
                        $result["bins"][] = $marker;
                        $total += $marker["value"];
                        if ($marker["value"] > 0)
                            $used_bin_count += 1;
                        if ($marker["value"] > $result["highest"])
                            $result["highest"] = $marker["value"];
                    }

                }
            }
            if ($result["bins"])
                if ($used_bin_count)
                    $result["average"] = $total / $used_bin_count;


            return $result;
        }

    }