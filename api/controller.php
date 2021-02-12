<?php
    // ini_set('display_errors', '0');
    include "database.php";
    include "utility.php";

    if (parameters_present(array("search", "page", "human_pval", "mouse_pval", "species"))) {
        $pleb = new PhenoSearch();
        $result = $pleb->search_by_term($_GET["search"], $_GET["page"], 20, $_GET["human_pval"], $_GET["mouse_pval"], $_GET["species"]);
        if ($result)
            echo json_encode($result);
        else
            echo null;
    } elseif (parameters_present(array("homologSearch", "term"))) {
        $pleb = new PhenoSearch();
        $result = $pleb->homologSearch($_GET["term"]);
        if ($result)
            echo json_encode($result);
        else
            echo null;
    } elseif (parameters_present(array("phenotypeBreakdown", "term"))) {
        $pleb = new PhenoSearch();
        $result = $pleb->get_phenotype_homology_breakdown($_GET["term"]);
        if ($result)
            echo json_encode($result);
    } else {
        echo null;
    }

    function parameters_present($params) {
        foreach ($params as $param) {
            if (!isset($_GET[$param]))
                return false;
        }
        return true;
    }

    class PhenoSearch {

        private $con = null;

        public function __construct(){
            $this->con = new GC_Connection("gc_mouse");
            $this->neo = new Neo_Connection();
        }

        public function get_phenotype_homology_breakdown($termID) {
            $return_package = ["Mappings" => [], "GWAS Studies" => [], "Gene Knockouts" => [], "Homologous Genes" => []];
            // Get mappings & synonyms for the chosen phenotype.
            $mappings = $this->get_ontology_mappings($termID);
            $return_package["Mappings"] = $mappings;
            // Get GWAS Studies
            if (strtoupper($mappings[0]["sourceOnt"]) == "MP") {
                $return_package["GWAS Studies"] = $this->get_mapped_gwas_studies($mappings[0]["mappedID"]);
            } else {
                $return_package["GWAS Studies"] = $this->get_mapped_gwas_studies($mappings[0]["sourceID"]);
            }
            // Get Knockouts
            if (strtoupper($mappings[0]["sourceOnt"]) == "MP") {
                $return_package["Gene Knockouts"] = $this->get_mouse_knockouts($mappings[0]["sourceID"]);
            } else {
                $return_package["Gene Knockouts"] = $this->get_mouse_knockouts($mappings[0]["mappedID"]);
            }
            return $return_package;
        }

        public function get_ontology_mappings($termID) {
            $result = $this->neo->execute("MATCH (N)-[M:LOOM_MAPPING]->(H) WHERE N.id = \"{$termID}\" RETURN N.id as sourceID, N.FSN as sourceLabel, N.ontology as sourceOnt, M.is_exact_match as isExactMatch, H.id as mappedID, H.FSN as mappedLabel, H.ontology as mappedOnt");
            $mappings = [];
            foreach ($result as $row) {
                $parsed = ["sourceID"=> $row->value("sourceID"), "sourceSynonyms"=>$this->get_term_synonyms($row->value("sourceID"), $row->value("sourceOnt")), "sourceLabel"=> $row->value("sourceLabel"), "sourceOnt"=> $row->value("sourceOnt"), "isExactMatch"=> $row->value("isExactMatch"), "mappedID"=> $row->value("mappedID"), "mappedSynonyms"=>$this->get_term_synonyms($row->value("mappedID"), $row->value("mappedOnt")),"mappedLabel"=> $row->value("mappedLabel"), "mappedOnt"=> $row->value("mappedOnt")];
                array_push($mappings, $parsed);
            }
            return $mappings;
        }

        private function get_term_synonyms($termID, $ontology) {
            $ontology = strtoupper($ontology);
            $result = $this->neo->execute("MATCH (N:{$ontology})-[r:HAS_SYNONYM]-(S) WHERE N.id = \"{$termID}\" RETURN S.FSN AS Synonym;");
            $synonyms = [];
            foreach ($result as $row) {
                array_push($synonyms, $row->value("Synonym"));
            }
            return $synonyms;
        }

        private function get_mapped_gwas_studies($termID) {
            $cmd = "CALL gc_mouse.get_gwas_studies_by_term('{$termID}', 0, 1, 500)";
            $gwas = $this->con->execute($cmd, "gc_mouse");
            if ($gwas)
                return mysqli_fetch_all($gwas, MYSQLI_ASSOC);
            else
                return [];
        }

        private function get_mouse_knockouts($termID) {
            $cmd = "CALL gc_mouse.get_mouse_knockouts_by_term('{$termID}', 0, 1, 500)";
            $gwas = $this->con->execute($cmd, "gc_mouse");
            if ($gwas)
                return mysqli_fetch_all($gwas, MYSQLI_ASSOC);
            else
                return [];
        }

        private function search_mouse_term($search) {
            $result = $this->neo->execute("MATCH (N:MP)-[r:LOOM_MAPPING]->(H) WHERE N.FSN =~ '(?i).*{$search}.*' RETURN N.FSN AS Mouse_Label, N.id as Mouse_ID, H.FSN AS Human_Label, H.id AS Human_ID");
            $matches = [];
            foreach ($result as $row) {
                $parsed = ["Mouse_ID"=>$row->value("Mouse_ID"), "Mouse_Label"=>$row->value("Mouse_Label"), "Human_ID"=>$row->value("Human_ID"), "Human_Label"=>$row->value("Human_Label")];
                array_push($matches, $parsed);
            }
            return $matches;
        }

        private function search_human_term($search) {
            $result = $this->neo->execute("MATCH (N)-[r:LOOM_MAPPING]->(H) WHERE (H:HPO OR H:MESH) AND N:MP AND H.FSN =~ '(?i).*{$search}.*' RETURN H.FSN AS Human_Label, H.id as Human_ID, N.FSN AS Mouse_Label, N.id AS Mouse_ID");
            $matches = [];
            foreach ($result as $row) {
                $parsed = ["Mouse_ID"=>$row->value("Mouse_ID"), "Mouse_Label"=>$row->value("Mouse_Label"), "Human_ID"=>$row->value("Human_ID"), "Human_Label"=>$row->value("Human_Label")];
                array_push($matches, $parsed);
            }
            return $matches;
        }

        public function search_by_term($user_input, $page, $limit, $human_pval, $mouse_pval, $species) {
            $user_input = $this->con->escape_input($user_input);
            $page = $this->con->escape_input($page);
            $limit = $this->con->escape_input($limit);
            $human_pval = $this->con->escape_input($human_pval);
            $mouse_pval = $this->con->escape_input($mouse_pval);

            $mapped_terms = null;
            if (strtolower($species) == "mouse") {
                $mapped_terms = $this->search_mouse_term($user_input);
            } else {
                $mapped_terms = $this->search_human_term($user_input);
            }

            $results = [];
            
            foreach ($mapped_terms as $mapping) {
                // Check if at least 1 GWAS & Knockout is present for this phenotype
                $cmd = "CALL gc_mouse.get_gwas_studies_by_term('{$mapping['Human_ID']}', {$human_pval}, {$page}, 0)";
                $gwas = $this->con->execute($cmd, "gc_mouse");
                $gwas = (int)mysqli_fetch_row($gwas)[0];

                $cmd = "CALL gc_mouse.get_mouse_knockouts_by_term('{$mapping['Mouse_ID']}', {$mouse_pval}, {$page}, 0)";
                $knockouts = $this->con->execute($cmd, "gc_mouse");
                $knockouts = (int)mysqli_fetch_row($knockouts)[0];

                if ($knockouts == 0 && $gwas == 0)
                    continue;
                
                $result = ["HPO/MeSH ID"=>$mapping["Human_ID"], "Human Phenotype"=>$mapping["Human_Label"], "MP ID"=>$mapping["Mouse_ID"], "MP Label"=>$mapping["Mouse_Label"], "GWAS Studies"=>$gwas, "Mouse Knockouts"=>$knockouts];
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