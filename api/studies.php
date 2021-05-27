<?php
    include_once 'database.php';
    include_once 'utility.php';
    include_once 'ontology.php';
    include_once 'mappings.php';

    class StudySearch {

        public function __construct(){
            $this->con = new GC_Connection("gc_mouse");
            $this->neo = new Neo_Connection();
        }

        public function get_phenotype_homology_breakdown($mouseID, $humanID, $humanOnt) {
            $return_package = ["Mappings" => [], "GWAS Studies" => [], "Gene Knockouts" => [], "Homologous Genes" => []];
            // Get mappings & synonyms for the chosen phenotype.
            $humanOnt = strtoupper($humanOnt);
            $mappings = Mapper::getMappings($mouseID, $humanID, $humanOnt, $this->neo);
            $return_package["Mappings"] = $mappings;
            // Get GWAS Studies
            if ($mappings) {
                $return_package["GWAS Studies"] = $mappings["gwas"] > 0 ? $this->get_mapped_gwas_studies($humanOnt, $mappings["humanID"]) : [];
                $return_package["Gene Knockouts"] = $mappings["experiments"] > 0 ? $this->get_mouse_knockouts($mappings["mouseID"]) : [];
            }
            return $return_package;
        }

        public function get_mouse_term_breakdown($mouseID) {
            $return_package = ["Mappings" => [], "GWAS Studies" => [], "Gene Knockouts" => [], "Homologous Genes" => []];
            // Get Mouse Knockouts
            $return_package["Gene Knockouts"] = $this->get_mouse_knockouts($mouseID);
            return $return_package;
        }

        public function get_human_term_breakdown($humanID, $ont) {
            $return_package = ["Mappings" => [], "GWAS Studies" => [], "Gene Knockouts" => [], "Homologous Genes" => []];
            // Get Mouse Knockouts
            $return_package["GWAS Studies"] = $this->get_mapped_gwas_studies($ont, $humanID);
            return $return_package;
        }

        public function get_mapped_gwas_studies($ontology, $termID) {
            $ont = new Ontology();
            if (strtoupper($ontology) != "MESH")
                $termID = $this->get_mesh_id_from_db($termID);
            $descendants = $ont->get_term_descendants($termID, "MESH");
            array_push($descendants, $termID);
            $result = [];
            $unique_studies = [];
            foreach ($descendants as $descendant) {
                $cmd = "CALL gc_mouse.get_gwas_studies_by_term('{$descendant}', 0, 1, 5000)";
                $gwas = $this->con->execute($cmd, "gc_mouse");
                if ($gwas) {
                    $gwas_records = mysqli_fetch_all($gwas, MYSQLI_ASSOC);
                    foreach ($gwas_records as $record) {
                        if (!in_array($record["ID"], $unique_studies)) {
                            array_push($result, $record);
                            array_push($unique_studies, $record["ID"]);
                        }
                    }
                }
            }
            if ($result)
                return $result;
            else
                return [];
        }

        public function get_mesh_id_from_db($termID) {
            $cmd = "CALL gc_mouse.get_mesh_mapping('{$termID}')";
            $cursor = $this->con->execute($cmd, "gc_mouse");
            $mesh_term = null;
            if ($cursor) {
                $result = mysqli_fetch_all($cursor, MYSQLI_ASSOC);
                foreach ($result as $term) {
                    $mesh_term = $term["meshID"];
                }
            }
            return $mesh_term;
        }

        public function get_mouse_knockouts($termID) {
            $ont = new Ontology();
            $descendants = $ont->get_term_descendants($termID, "MP");
            array_push($descendants, $termID);
            $result = [];
            foreach ($descendants as $descendant) {
                $cmd = "CALL gc_mouse.get_mouse_knockouts_by_term('{$descendant}', 0, 1, 5000)";
                $knockout = $this->con->execute($cmd, "gc_mouse");
                if ($knockout) {
                    $knockout_records = mysqli_fetch_all($knockout, MYSQLI_ASSOC);
                    foreach ($knockout_records as $record) {
                        array_push($result, $record);
                    }
                }
            }
            if ($result)
                return $result;
            else
                return [];
        }

        public function search_by_term($user_input, $page, $limit, $human_pval, $mouse_pval, $species) {
            $user_input = $this->con->escape_input($user_input);
            $page = $this->con->escape_input($page);
            $limit = $this->con->escape_input($limit);
            $human_pval = $this->con->escape_input($human_pval);
            $mouse_pval = $this->con->escape_input($mouse_pval);
            $species = strtolower($species);
            
            $ont = new Ontology();
            if (strtolower($species) == "mouse") {
                $mapped_hpo_terms = $ont->search_mouse_term($user_input, "HPO", true);
                $mapped_mesh_terms = $ont->search_mouse_term($user_input, "MESH", true);
            } else {
                $mapped_hpo_terms = $ont->search_human_term($user_input, "HPO", true);
                $mapped_mesh_terms = $ont->search_human_term($user_input, "MESH", true);
            }
            $mapped_terms = array_merge($mapped_hpo_terms, $mapped_mesh_terms);
            $results = [];
            $mouseIDs = [];
            $humanIDs = [];
            foreach ($mapped_terms as $mapping) {
                $skip_duplicate = false; //filter out duplicates which do not have a mapped ID
                // Check if at least 1 GWAS or Knockout is present for this phenotype
                if ($species == "mouse")
                    if (in_array($mapping["mouseID"], $mouseIDs)) {
                        if (!$mapping["humanID"]) 
                            $skip_duplicate = true;
                    } else
                        array_push($mouseIDs, $mapping["mouseID"]);
                else
                    if (in_array($mapping["humanID"], $humanIDs)) {
                        if (!$mapping["mouseID"]) 
                            $skip_duplicate = true;
                    } else
                        array_push($humanIDs, $mapping["humanID"]);
                if (!$skip_duplicate) {
                    $result = ["Human Ontology"=>$mapping["humanOnt"], "ID"=>$mapping["humanID"], "Human Phenotype"=>$mapping["humanLabel"], "MP ID"=>$mapping["mouseID"], "MP Label"=>$mapping["mouseLabel"], "GWAS Studies"=>$mapping["gwas"], "Mouse Knockouts"=>$mapping["experiments"]];
                    array_push($results, $result);
                }

            }
            // $temp = [];
            // foreach($mapped_mesh_terms as $mapping) {
            //     if (!in_array($mapping, $temp)) {
            //         $temp[] = $mapping;
            //     }
            // } 
            // $mapped_mesh_terms = $temp;

            $total = count($results);
            if ($total > 0)
                return [$results, $total];
            else
                return [null, 0];
        }

        public function homologSearch($mpid) {
            $mpid = $this->con->escape_input($mpid);
            $results = $this->con->execute("CALL gc_mouse.get_mouse_knockout_by_term('{$mpid}');", "gc_mouse");
            if ($results) {
                $total = $results->num_rows;
                $return_package = array(mysqli_fetch_all($results, MYSQLI_ASSOC), $total);
                return $return_package;
            } else {
                return null;
            }
        }

    }
