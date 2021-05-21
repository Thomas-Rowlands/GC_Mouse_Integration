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


        public function get_mapped_gwas_studies($ontology, $termID) {
            $ont = new Ontology();
            $descendants = $ont->get_term_descendants($termID, $ontology);
            array_push($descendants, $termID);
            $result = [];
            foreach ($descendants as $descendant) {
                $cmd = "CALL gc_mouse.get_gwas_studies_by_term('{$descendant}', 0, 1, 0)";
                $gwas = $this->con->execute($cmd, "gc_mouse");
                if ($gwas) {
                    $gwas_records = mysqli_fetch_all($gwas, MYSQLI_ASSOC);
                    foreach ($gwas_records as $record) {
                        array_push($result, $record);
                    }
                }
            }
            if ($result)
                return $result;
            else
                return [];
        }

        public function get_mouse_knockouts($termID) {
            $cmd = "CALL gc_mouse.get_mouse_knockouts_by_term('{$termID}', 0, 1, 500)";
            $gwas = $this->con->execute($cmd, "gc_mouse");
            if ($gwas)
                return mysqli_fetch_all($gwas, MYSQLI_ASSOC);
            else
                return [];
        }

        public function search_by_term($user_input, $page, $limit, $human_pval, $mouse_pval, $species) {
            $user_input = $this->con->escape_input($user_input);
            $page = $this->con->escape_input($page);
            $limit = $this->con->escape_input($limit);
            $human_pval = $this->con->escape_input($human_pval);
            $mouse_pval = $this->con->escape_input($mouse_pval);

            $mapped_terms = null;
            $ont = new Ontology();
            if (strtolower($species) == "mouse") {
                $mapped_hpo_terms = $ont->search_mouse_term($user_input, "HPO");
                $mapped_mesh_terms = $ont->search_mouse_term($user_input, "MESH");
            } else {
                $mapped_hpo_terms = $ont->search_human_term($user_input, "HPO");
                $mapped_mesh_terms = $ont->search_human_term($user_input, "MESH");
            }
            $results = [];
            
            foreach ($mapped_hpo_terms as $mapping) {
                // Check if at least 1 GWAS or Knockout is present for this phenotype
                $result = ["Human Ontology"=>"HPO", "ID"=>$mapping["humanID"], "Human Phenotype"=>$mapping["humanLabel"], "MP ID"=>$mapping["mouseID"], "MP Label"=>$mapping["mouseLabel"], "GWAS Studies"=>$mapping["gwas"], "Mouse Knockouts"=>$mapping["experiments"]];
                array_push($results, $result);
            }
            $temp = [];
            foreach($mapped_mesh_terms as $mapping) {
                if (!in_array($mapping, $temp)) {
                    $temp[] = $mapping;
                }
            } 
            $mapped_mesh_terms = $temp;
            foreach ($mapped_mesh_terms as $mapping) {
                $result = ["Human Ontology"=>"MeSH", "ID"=>$mapping["humanID"], "Human Phenotype"=>$mapping["humanLabel"], "MP ID"=>$mapping["mouseID"], "MP Label"=>$mapping["mouseLabel"], "GWAS Studies"=>$mapping["gwas"], "Mouse Knockouts"=>$mapping["experiments"]];
                array_push($results, $result);
            }
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
