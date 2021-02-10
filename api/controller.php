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
        }

        public function get_phenotype_homology_breakdown($termID) {
            $return_package = ["Mappings" => [], "GWAS Studies" => [], "Gene Knockouts" => [], "Homologous Genes" => []];
            $mappings = $this->get_ontology_mappings($termID);
            $return_package["Mappings"] = $mappings;
            return $return_package;
        }

        private function get_ontology_mappings($termID) {
            $neo = new Neo_Connection();
            $result = $neo->execute("MATCH (N)-[M:LOOM_MAPPING]->(H) WHERE N.id = \"{$termID}\" RETURN N.id as sourceID, N.FSN as sourceLabel, N.ontology as sourceOnt, M.is_exact_match as isExactMatch, H.id as mappedID, H.FSN as mappedLabel, H.ontology as mappedOnt");
            $mappings = [];
            foreach ($result as $row) {
                $parsed = ["sourceID"=> $row->value("sourceID"), "sourceLabel"=> $row->value("sourceLabel"), "sourceOnt"=> $row->value("sourceOnt"), "isExactMatch"=> $row->value("isExactMatch"), "mappedID"=> $row->value("mappedID"), "mappedLabel"=> $row->value("mappedLabel"), "mappedOnt"=> $row->value("mappedOnt")];
                array_push($mappings, $parsed);
            }
            return $mappings;
        }

        private function get_mapped_gwas_studies($mouse_results) {
            include_once "./OntologyMappingInterface/server/ontology.php";
            $gwas_results = [];
            while ($row = $mouse_results->fetch_assoc()) {
                die(search($row["Ontology Term"], "MP", "MeSH", "./OntologyMappingInterface/ontology_cache"));
            }

        }

        private function search_mouse_term($search) {
            $neo = new Neo_Connection();
            $result = $neo->execute("MATCH (N:MP)-[r:LOOM_MAPPING]->(H) WHERE N.FSN STARTS WITH \"{$search}\" RETURN N.FSN AS Mouse_Label, N.id as Mouse_ID, H.FSN AS Human_Label, H.id AS Human_ID");
            $matches = [];
            foreach ($result as $row) {
                $parsed = ["Mouse_ID"=>$row->value("Mouse_ID"), "Mouse_Label"=>$row->value("Mouse_Label"), "Human_ID"=>$row->value("Human_ID"), "Human_Label"=>$row->value("Human_Label")];
                array_push($matches, $parsed);
            }
            return $matches;
        }

        private function search_human_term($search) {
            $neo = new Neo_Connection();
            $result = $neo->execute("MATCH (N)-[r:LOOM_MAPPING]->(H) WHERE (N:HPO OR N:MESH) AND H:MP AND N.FSN STARTS WITH \"{$search}\" RETURN N.FSN AS Human_Label, N.id as Human_ID, H.FSN AS Mouse_Label, H.id AS Mouse_ID");
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
                if ($gwas == 0)
                    continue;

                $cmd = "CALL gc_mouse.get_mouse_knockouts_by_term('{$mapping['Mouse_ID']}', {$mouse_pval}, {$page}, 0)";
                $knockouts = $this->con->execute($cmd, "gc_mouse");
                $knockouts = (int)mysqli_fetch_row($knockouts)[0];
                if ($knockouts == 0)
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