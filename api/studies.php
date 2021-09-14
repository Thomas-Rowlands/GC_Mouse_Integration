<?php
    include_once 'database.php';
    include_once 'utility.php';
    include_once 'ontology.php';
    include_once 'mappings.php';
    include_once 'genome.php';

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

        public function get_mouse_term_breakdown($mouseID, $targetOnt) {
            $ont = new Ontology();
            $return_package = ["Mappings" => [], "GWAS Studies" => [], "Gene Knockouts" => [], "Homologous Genes" => []];
            // Get Mouse Knockouts
            $return_package["Mappings"] = $ont->get_human_mapping_by_id($mouseID, $targetOnt);
            $return_package["Gene Knockouts"] = $this->get_mouse_knockouts($mouseID);
            return $return_package;
        }

        public function get_human_term_breakdown($humanID, $ontology) {
            $ont = new Ontology();
            $return_package = ["Mappings" => [], "GWAS Studies" => [], "Gene Knockouts" => [], "Homologous Genes" => []];
            // Get GWAS Records
            $return_package["GWAS Studies"] = $this->get_mapped_gwas_studies($ontology, $humanID);
            $return_package["Mappings"] = $ont->get_mp_mapping_by_id($humanID);
            $return_package["Gene Knockouts"] = $return_package["Mappings"] ? $this->get_mouse_knockouts($return_package["Mappings"][0]["mappedID"]) : [];
            return $return_package;
        }

        public function get_mapped_gwas_studies($ontology, $termID) {
            $ont = new Ontology();
            if (strtoupper($ontology) != "MESH")
                $termID = $this->get_mesh_id_from_db($termID);
            $descendants = $ont->get_term_descendants($termID, "MESH");
            array_push($descendants, $termID);
            $result = [];
            $term_string = "";
            foreach ($descendants as $descendant) {
                $term_string .= "'" . str_replace(" ", "", $descendant) . "',";
            }
            $term_string = rtrim($term_string, ",");
            $result = $this->neo->execute("MATCH (s:Study)-[:containsGWASResult]->(g:Result)<-[:hasGWASResult]-(n:" . $ontology . ")
            WHERE n.id in [" . $term_string . "]
            RETURN DISTINCT s.id AS id, s.Name AS name, MAX(g.value) AS p_value", []);
            $studies = [];
            if ($result)
                foreach ($result as $row) {
                    array_push($studies, ["id"=>$row->get("id"), "name"=>$row->get("name"), "-log P-value"=>round($row->get("p_value"), 2)]);
                }
            return $studies;
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
            $term_string = "";
            foreach ($descendants as $descendant) {
                $term_string .= "'" . str_replace(" ", "", $descendant) . "',";
            }
            $term_string = rtrim($term_string, ",");
            $cmd = "SELECT DISTINCT mg.gene_symbol AS \"Gene\", mm.marker_accession_id AS \"Gene Key\", e.male_count AS \"Males\", e.female_count AS \"Females\", ROUND(LOG((CONVERT(e.p_value, DECIMAL(30, 30)) + 0)) * -1, 3) AS \"-log P-value\", pr.name AS \"Procedure\", pa.name AS \"Parameter\",
            expa.parameter_stable_key AS \"Parameter Key\", expr.procedure_stable_key AS \"Procedure Key\"
            FROM experiments AS e
            INNER JOIN experiment_top_level_phenotypes AS etp ON etp.experiment_id = e.experiments_id
            INNER JOIN experiment_phenotypes AS ep ON ep.experiment_id = e.experiments_id
            INNER JOIN mp_phenotypes AS mptl ON mptl.mp_phenotype_id = etp.phenotype_id
            INNER JOIN mp_phenotypes AS mp ON mp.mp_phenotype_id = ep.phenotype_id
            INNER JOIN mouse_markers AS mm ON mm.mouse_gene_id = e.mouse_marker_id
            INNER JOIN mouse_genes AS mg ON mg.id = mm.mouse_gene_id
            INNER JOIN parameters AS pa ON pa.parameters_id = e.parameter_id
            INNER JOIN experiment_parameter AS expa ON expa.experiment_id = e.experiments_id
            INNER JOIN procedures AS pr ON pr.procedures_id = e.procedure_id
            INNER JOIN experiment_procedure AS expr ON expr.experiment_id = e.experiments_id
            WHERE (mp.mp_term_id in ($term_string) OR mptl.mp_term_id in ($term_string))
                AND ROUND(LOG((CONVERT(e.p_value, DECIMAL(30, 30)) + 0)) * -1, 3) > 0";
            $knockout = $this->con->execute($cmd, "gc_mouse");
            if ($knockout) {
                $knockout_records = mysqli_fetch_all($knockout, MYSQLI_ASSOC);
                foreach ($knockout_records as $record) {
                    array_push($result, $record);
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
            $mapped_terms = [];
            $ont = new Ontology();
            $mapped_terms = [];
            if ($species == "mouse") {
                //$mapped_hpo_terms = $ont->search_mouse_term($user_input, "HPO", true, $human_pval, $mouse_pval);
                $mapped_terms = $ont->search_mouse_term($user_input, "MESH", true, $human_pval, $mouse_pval);
            } else {
                //$mapped_hpo_terms = $ont->search_human_term($user_input, "HPO", true, $human_pval, $mouse_pval);
                $mapped_terms = $ont->search_human_term($user_input, "MESH", true, $human_pval, $mouse_pval);
            }
            //$mapped_terms = array_merge($mapped_hpo_terms, $mapped_mesh_terms);
            $results = [];
            $mouseIDs = [];
            $humanIDs = [];

            foreach ($mapped_terms as $mapping) {
                $skip_duplicate = false; //filter out duplicates which do not have a mapped ID
                // Check if at least 1 GWAS or Knockout is present for this phenotype
                if ($species == "mouse")
                    if (in_array($mapping["id"], $mouseIDs)) {
                        if (!$mapping["mappedID"]) 
                            $skip_duplicate = true;
                    } else
                        array_push($mouseIDs, $mapping["id"]);
                else
                    if (in_array($mapping["id"], $humanIDs)) {
                        if (!$mapping["mappedID"]) 
                            $skip_duplicate = true;
                    } else
                        array_push($humanIDs, $mapping["id"]);
                if (!$skip_duplicate) {
                    $humanOnt = "";
                    $humanID = "";
                    $humanLabel = "";
                    $humanSynonyms = [];
                    $mouseID = "";
                    $mouseLabel = "";
                    $mouseSynonyms = "";
                    if ($species == "mouse") {
                        $humanOnt = $mapping["mappedOnt"];
                        $humanID = $mapping["mappedID"];
                        $humanLabel = $mapping["mappedLabel"];
                        $humanSynonyms = $mapping["mappedSynonyms"];
                        $mouseID = $mapping["id"];
                        $mouseLabel = $mapping["label"];
                        $mouseSynonyms = $mapping["synonyms"];
                    } else {
                        $humanOnt = $mapping["ont"];
                        $humanID = $mapping["id"];
                        $humanLabel = $mapping["label"];
                        $humanSynonyms = $mapping["synonyms"];
                        $mouseID = $mapping["mappedID"];
                        $mouseLabel = $mapping["mappedLabel"];
                        $mouseSynonyms = $mapping["mappedSynonyms"];
                    }
                    $result = ["Human Ontology"=>$humanOnt, "ID"=>$humanID, "Human Phenotype"=>$humanLabel, "Human Synonyms"=>$humanSynonyms, 
                    "MP ID"=>$mouseID, "MP Label"=>$mouseLabel, "Mouse Synonyms"=>$mouseSynonyms, 
                    "GWAS Studies"=>$mapping["gwas"], "Mouse Knockouts"=>$mapping["experiments"]];
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
