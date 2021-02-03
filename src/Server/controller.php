<?php
    include "./Server/Database.php";
    include "./Server/Utility.php";
    ini_set('memory_limit', '1024M');
    if (parameters_present(array("search", "page", "offset", "human_pval", "mouse_pval"))) {
        $pleb = new PhenoSearch();
        $result = $pleb->search_by_term($_GET["search"], $_GET["page"], 20, $_GET["human_pval"], $_GET["mouse_pval"]);
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

        private function get_mapped_gwas_studies($mouse_results) {
            include_once "./OntologyMappingInterface/server/ontology.php";
            $gwas_results = array();
            while ($row = $mouse_results->fetch_assoc()) {
                die(search($row["Ontology Term"], "MP", "MeSH", "./OntologyMappingInterface/ontology_cache"));
            }

        }

        public function search_by_term($user_input, $page, $limit, $human_pval, $mouse_pval) {
            $user_input = $this->con->escape_input($user_input);
            $page = $this->con->escape_input($page);
            $limit = $this->con->escape_input($limit);
            $human_pval = $this->con->escape_input($human_pval);
            $mouse_pval = $this->con->escape_input($mouse_pval);
            $total_records = $this->con->execute("CALL gc_mouse.search_by_term_label('{$user_input}', {$page}, 0, {$human_pval}, {$mouse_pval});", "gc_mouse");
            $total = mysqli_fetch_row($total_records)[0];
            if ($limit > 20)
                $limit = 20;
            if ($total > 0) {
                
                $results = $this->con->execute("CALL gc_mouse.search_by_term_label('{$user_input}', {$page}, {$limit}, {$human_pval}, {$mouse_pval});", "gc_mouse");
                $gwas_results = $this->get_mapped_gwas_studies($results);
                if ($results) {
                    $return_package = array(mysqli_fetch_all($results, MYSQLI_ASSOC), $total);
                    return $return_package;
                }
                else
                    return null;
            } else {
                return null;
            }
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