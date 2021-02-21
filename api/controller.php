<?php
    // ini_set('display_errors', '0');
    include_once "studies.php";
    if (isset($_GET['type'])) {
        if ($_GET['type'] == "study") {
            if (parameters_present(array("search", "page", "human_pval", "mouse_pval", "species"))) {
                $study = new StudySearch();
                $result = $study->search_by_term($_GET["search"], $_GET["page"], 20, $_GET["human_pval"], $_GET["mouse_pval"], $_GET["species"]);
                if ($result)
                    echo json_encode($result);
                else
                    echo null;
            } elseif (parameters_present(array("homologSearch", "term"))) {
                $study = new StudySearch();
                $result = $study->homologSearch($_GET["term"]);
                if ($result)
                    echo json_encode($result);
                else
                    echo null;
            } elseif (parameters_present(array("phenotypeBreakdown", "term"))) {
                $study = new StudySearch();
                $result = $study->get_phenotype_homology_breakdown($_GET["term"]);
                if ($result)
                    echo json_encode($result);
            } else {
                echo null;
            }
        } else if ($_GET['type'] == "ontology") {
            if (parameters_present(array("ontologySearch", "term", "ontology"))) {
                $ont = new Ontology();
                $result = null;
                $result = $ont->get_ontology_trees($_GET["term"], $_GET["ontology"]);
                if ($result)
                    echo json_encode($result);
                else
                    echo null;
            }
        }
    }


    function parameters_present($params) {
        foreach ($params as $param) {
            if (!isset($_GET[$param]))
                return false;
        }
        return true;
    }

?>