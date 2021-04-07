<?php
    include_once 'database.php';
    include_once 'utility.php';
    include_once 'ontology.php';

    class StudySearch {

        public function __construct(){
            $this->con = new GC_Connection("gc_mouse");
            $this->neo = new Neo_Connection();
        }

        public function get_phenotype_homology_breakdown($termID) {
            $return_package = ["Mappings" => [], "GWAS Studies" => [], "Gene Knockouts" => [], "Homologous Genes" => []];
            // Get mappings & synonyms for the chosen phenotype.
            $ont = new Ontology();
            $mappings = $ont->get_ontology_mappings($termID);

            $return_package["Mappings"] = $mappings;
            // Get GWAS Studies
            if ($mappings) {
                $return_package["GWAS Studies"] = $this->get_mapped_gwas_studies($mappings["humanID"]);
                $return_package["Gene Knockouts"] = $this->get_mouse_knockouts($mappings["mouseID"]);
            }
            return $return_package;
        }


        public function get_mapped_gwas_studies($termID) {
            $cmd = "CALL gc_mouse.get_gwas_studies_by_term('{$termID}', 0, 1, 500)";
            $gwas = $this->con->execute($cmd, "gc_mouse");
            if ($gwas)
                return mysqli_fetch_all($gwas, MYSQLI_ASSOC);
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
                $mapped_terms = $ont->search_mouse_term($user_input);
            } else {
                $mapped_terms = $ont->search_human_term($user_input);
            }
            $results = [];
            
            foreach ($mapped_terms as $mapping) {
                // Check if at least 1 GWAS & Knockout is present for this phenotype
                $cmd = "CALL gc_mouse.get_gwas_studies_by_term('{$mapping['humanID']}', {$human_pval}, {$page}, 0)";
                $gwas = $this->con->execute($cmd, "gc_mouse");
                $gwas = (int)mysqli_fetch_row($gwas)[0];
                $cmd = "CALL gc_mouse.get_mouse_knockouts_by_term('{$mapping['mouseID']}', {$mouse_pval}, {$page}, 0)";
                $knockouts = $this->con->execute($cmd, "gc_mouse");
                $knockouts = (int)mysqli_fetch_row($knockouts)[0];

                if ($knockouts == 0 && $gwas == 0)
                    continue;
                
                $result = ["HPO/MeSH ID"=>$mapping["humanID"], "Human Phenotype"=>$mapping["humanLabel"], "MP ID"=>$mapping["mouseID"], "MP Label"=>$mapping["mouseLabel"], "GWAS Studies"=>$gwas, "Mouse Knockouts"=>$knockouts];
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

?>