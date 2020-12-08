<?php
    include "./Server/Database.php";
    include "./Server/Utility.php";

    if (isset($_GET["search"]) && isset($_GET["page"])) {
        $pleb = new PhenoSearch();
        $result = $pleb->search($_GET["search"], $_GET["page"], 20);
        if ($result)
            echo json_encode($result);
        else
            echo null;
    } elseif (isset($_GET["homologSearch"]) && isset($_GET["term"])) { 
    } else {
        echo "Invalid arguments";
    }

    class PhenoSearch {

        private $con = null;

        public function __construct(){
            $this->con = new GC_Connection("gc_mouse");
        }

        public function search($user_input, $page, $limit) {
            $user_input = $this->con->escape_input($user_input);
            $total_records = $this->con->execute("CALL gc_mouse.search_by_term_label('{$user_input}', {$page}, 0);", "gc_mouse");
            $total = mysqli_fetch_row($total_records)[0];
            if ($limit > 20)
                $limit = 20;
            if ($total > 0) {
                $results = $this->con->execute("CALL gc_mouse.search_by_term_label('{$user_input}', {$page}, {$limit});", "gc_mouse");
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

    }
