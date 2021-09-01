<?php
    include_once 'database.php';
    include_once 'studies.php';

    

    class Genome {

        private static $chromosomes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
        15, 16, 17, 18, 19, 20, 21, 22, "X", "Y"];

        public function __construct()
        {
            $this->con = new GC_Connection("gc_mouse");
            $this->neo = new Neo_Connection();
            $this->ont = new Ontology();
        }

        public function getPhenotypeMarkers($termID, $search_ont)
        {
            $descendants = $this->ont->get_term_descendants($termID, "MESH");
            array_push($descendants, $termID);
            $result = [];
            $term_string = "";
            foreach ($descendants as $descendant) {
                $term_string .= "'" . str_replace(" ", "", $descendant) . "',";
            }
            $term_string = rtrim($term_string, ",");
            $cmd = "SELECT DISTINCT m.Accession AS 'name', mc.Chr AS 'chr', mc.Start AS 'start', mc.Stop AS 'stop', si.NegLogPValue AS 'pval'
            FROM GC_study.Study AS s
            INNER JOIN GC_study.Experiment AS e ON e.StudyID = s.StudyID
            INNER JOIN GC_study.PhenotypeMethod AS pm ON pm.PhenotypeMethodID = e.PhenotypeMethodID
            INNER JOIN GC_study.PPPA AS ppp ON ppp.PhenotypePropertyID = pm.PhenotypePropertyID
            INNER JOIN GC_study.PhenotypeAnnotation AS pa ON pa.PhenotypeAnnotationID = ppp.PhenotypeAnnotationID
            INNER JOIN GC_study.Resultset AS rs ON rs.ExperimentID = e.ExperimentID
            INNER JOIN GC_study.Significance AS si ON si.ResultsetID = rs.ResultsetID
            INNER JOIN GC_study.Usedmarkerset AS us ON us.UsedmarkersetID = si.UsedmarkersetID
            INNER JOIN GC_marker.Marker AS m ON m.Identifier = us.MarkerIdentifier
            INNER JOIN GC_marker.MarkerCoord AS mc ON mc.MarkerID = m.MarkerID
WHERE pa.PhenotypeIdentifier in (" . $term_string . ") AND si.NegLogPValue >= 0 AND mc.Start > 0";
           $markers_result = $this->con->execute($cmd, "gc_mouse");
            if ($markers_result) {
                $markers = mysqli_fetch_all($markers_result, MYSQLI_ASSOC);
                foreach ($markers as $marker) {
                    array_push($result, $marker);
                }
            }
            
            if ($result)
                return $result;
            else
                return [];

        }

        public function getPhenotypeMarkerBins($termID, $searchOnt)
        {
            if (strtoupper($searchOnt) !== "MESH") {
                $study = new StudySearch();
                $termID = $study->get_mesh_id_from_db($termID);
                if (!$termID)
                    return [];
            }
            $descendants = $this->ont->get_term_descendants($termID, "MESH");
            array_push($descendants, $termID);
            $result = [];
            $term_string = "";
            foreach ($descendants as $descendant) {
                $term_string .= "'" . str_replace(" ", "", $descendant) . "',";
            }
            $term_string = rtrim($term_string, ",");
            foreach (Genome::$chromosomes as $chromosome) {
                $cmd = "SELECT '".$chromosome."' AS chr, bin, value, highest_significance
                FROM human_markers_chr".$chromosome." AS hm
                WHERE hm.mesh_id in (" . $term_string . ")";
                $markers_result = $this->con->execute($cmd, "gc_bin");
                if ($markers_result) {
                    $markers = mysqli_fetch_all($markers_result, MYSQLI_ASSOC);
                    foreach ($markers as $marker) {
                        array_push($result, $marker);
                    }
                }
            }


            
            if ($result)
                return $result;
            else
                return [];

        }

        public function getHumanGenes() 
        {
            $cmd = "SELECT hg.gene_symbol AS \"Gene\", chr.name AS \"Chromosome\", hg.start, hg.stop, CASE hom.human_gene_id WHEN NULL THEN 0 ELSE 1 END AS \"is_homolog\"
            FROM gc_mouse.human_genes AS hg
            INNER JOIN chromosomes AS chr ON chr.id = hg.chromosome_id
            RIGHT JOIN homologs AS hom ON hom.human_gene_id = hg.id;";
            $genes_result = $this->con->execute($cmd, "gc_mouse");
            $result = [];
            if ($genes_result) {
                $genes = mysqli_fetch_all($genes_result, MYSQLI_ASSOC);
                foreach ($genes as $gene) {
                    array_push($result, $gene);
                }
            }
            
            if ($result)
                return $result;
            else
                return [];
        }

        public function getMouseGenes()
        {
            $cmd = "SELECT mg.gene_symbol AS \"Gene\", chr.name AS \"Chromosome\", mg.start, mg.stop, CASE hom.mouse_gene_id WHEN NULL THEN 0 ELSE 1 END AS \"is_homolog\"
            FROM gc_mouse.mouse_genes AS mg
            INNER JOIN chromosomes AS chr ON chr.id = mg.chromosome_id
            RIGHT JOIN homologs AS hom ON hom.mouse_gene_id = mg.id;";
           $markers_result = $this->con->execute($cmd, "gc_mouse");
            if ($markers_result) {
                $markers = mysqli_fetch_all($markers_result, MYSQLI_ASSOC);
                foreach ($markers as $marker) {
                    array_push($result, $marker);
                }
            }
            
            if ($result)
                return $result;
            else
                return [];
        }

        public function getMouseKnockoutBins($termID, $searchOnt)
        {
            if (strtoupper($searchOnt) != "MP") {
                $termID = $this->ont->get_mp_mapping_by_id($termID);
                if (!$termID)
                    return [];
                if (is_array($termID))
                    $termID = $termID[0];
            }
            $descendants = $this->ont->get_term_descendants($termID, "MP");
            array_push($descendants, $termID);
            $result = [];
            $term_string = "";
            foreach ($descendants as $descendant) {
                $term_string .= "'" . str_replace(" ", "", $descendant) . "',";
            }
            $term_string = rtrim($term_string, ",");
            foreach (Genome::$chromosomes as $chromosome) {
                $cmd = "SELECT '".$chromosome."' AS chr, bin, value, highest_significance
                FROM mouse_knockouts_chr".$chromosome." AS mk
                WHERE mk.mp_id in (" . $term_string . ")";
                $markers_result = $this->con->execute($cmd, "gc_bin");
                if ($markers_result) {
                    $markers = mysqli_fetch_all($markers_result, MYSQLI_ASSOC);
                    foreach ($markers as $marker) {
                        array_push($result, $marker);
                    }
                }
            }


            
            if ($result)
                return $result;
            else
                return [];
        }

    }

?>