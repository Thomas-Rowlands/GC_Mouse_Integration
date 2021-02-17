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
                //search for closest matching term ID
                if ($_GET["ontology"] == "MP") {
                    $termID = $ont->search_mouse_term($_GET["term"]);
                    if ($termID)
                        $termID = $termID[0]["Mouse_ID"];
                    
                } else {
                    $termID = $ont->search_human_term($_GET["term"]);
                    if ($termID)
                        $termID = $termID[0]["Human_ID"];
                }
                    
                if ($termID) {
                    $result = ["sourceTree" => [], "mappedTree" => [], "mappedID" => "", "isExactMatch" => False];
                    $result["sourceTree"] = $ont->get_ontology_hierarchy($termID, $_GET["ontology"]);
                    
                    $mapped_term = $ont->get_ontology_mappings($termID);             
                    
                    if ($mapped_term) {
                        $result["mappedTree"] = $ont->get_ontology_hierarchy($mapped_term[0]["mappedID"], $mapped_term[0]["mappedOnt"]);
                        $result["mappedID"] = $mapped_term[0]["mappedID"];
                        $result["isExactMatch"] = $mapped_term[0]["isExactMatch"];
                    }

                    if ($result["sourceTree"])
                        echo json_encode($result);
                    else
                        echo null;
                }
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