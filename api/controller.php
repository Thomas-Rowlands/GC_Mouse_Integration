<?php
    // ini_set('display_errors', '0');
    header('Content-Type: application/json');
    include_once "studies.php";
    include_once "tree.php";

    if (isset($_GET['type'])) {
        if ($_GET['type'] == "study") {
            if (parameters_present(array("search", "page", "human_pval", "mouse_pval", "species"))) {
                $study = new StudySearch();
                $result = $study->search_by_term($_GET["search"], $_GET["page"], 20, $_GET["human_pval"], $_GET["mouse_pval"], $_GET["species"]);
                if ($result)
                    echo json_encode($result);
                else
                    echo null;
            } else if (parameters_present(array("homologSearch", "term"))) {
                $study = new StudySearch();
                $result = $study->homologSearch($_GET["term"]);
                if ($result)
                    echo json_encode($result);
                else
                    echo null;
            } else if (parameters_present(array("phenotypeBreakdown", "mouseTerm", "humanTerm", "humanOntology"))) {
                $study = new StudySearch();
                $result = null;
                if ($_GET["mouseTerm"] != null && $_GET["humanTerm"] != null) {
                    if (validate_ontology($_GET["humanOntology"]))
                        $result = $study->get_phenotype_homology_breakdown($_GET["mouseTerm"], $_GET["humanTerm"], strtoupper($_GET["humanOntology"]));
                    else
                        echo "invalid ontology specified";
                } else if ($_GET["mouseTerm"] != null) {
                    $result = $study->get_mouse_term_breakdown($_GET["mouseTerm"]);
                } else {
                    if (validate_ontology($_GET["humanOntology"]))
                        $result = $study->get_human_term_breakdown($_GET["humanTerm"], strtoupper($_GET["humanOntology"]));
                    else
                        echo "invalid ontology specified";
                }
                if ($result)
                    echo json_encode($result);
                else
                    echo null;
            } else {
                echo null;
            }
        } else if ($_GET['type'] == "ontology") {
            if (parameters_present(array("getRoot", "ontology", "mappingOnt"))) {
                if (validate_ontology($_GET["ontology"]) && validate_ontology($_GET["mappingOnt"])) {
                    $ont = new Ontology();
                    $result = null;
                    $result = $ont->get_root_ontology_tree(strtoupper($_GET["ontology"]), strtoupper($_GET["mappingOnt"]));
                    if ($result)
                        echo json_encode($result);
                    else
                        echo null;
                } else {
                    echo "invalid ontology specified.";
                }

            } else if (parameters_present(array("getRoots", "ontology"))) {
                if (validate_ontology($_GET["ontology"])) {
                    $ont = new Ontology();
                    $result = null;
                    $result = $ont->get_root_ontology_trees($_GET["ontology"]);
                    if ($result)
                        echo json_encode($result);
                    else
                        echo null;
                } else {
                    echo "invalid ontology specified.";
                }

            } else if (parameters_present(array("search", "term", "humanOntology", "mouseOntology", "searchOntology"))) {
                if (validate_ontology($_GET["humanOntology"]) && validate_ontology($_GET["mouseOntology"]) && validate_ontology($_GET["searchOntology"])) {
                    $ont = new Ontology();
                    $result = null;
                    $result = $ont->get_ontology_trees($_GET["term"], strtoupper($_GET["humanOntology"]), strtoupper($_GET["mouseOntology"]), strtoupper($_GET["searchOntology"]));
                    if ($result)
                        echo json_encode($result);
                    else
                        echo null;
                } else {
                    echo "invalid ontology specified.";
                }

            } else if (parameters_present(array("childSearch", "term", "ontology", "mappingOntology"))) {
                if (validate_ontology($_GET["mappingOntology"]) && validate_ontology($_GET["ontology"])) {
                    $ont = new Ontology();
                    $result = null;
                    $result = $ont->getTermChildren($_GET["term"], $_GET["ontology"], $_GET["mappingOntology"]);
                    if ($result)
                        echo json_encode($result);
                    else
                        echo null;
                } else {
                    echo "invalid ontology specified";
                }

            }
        } else if ($_GET['type'] == "genome") {
            if (validate_ontology($_GET["ontology"]) && $_GET["phenotype"]) {
                $genome = new Genome();
                $result = ["markers" => $genome->getPhenotypeMarkerBins($_GET["phenotype"], $_GET["ontology"]), "knockouts" => $genome->getMouseKnockoutBins($_GET["phenotype"], $_GET["ontology"])];
                if ($result)
                    echo json_encode($result);
                else
                    echo null;
            }
        }
    }

    function validate_ontology($ont) {
        if (in_array(strtoupper($ont), ["MP", "HPO", "MESH"]))
            return true;
        else
            return false;
    }

    function parameters_present($params) {
        foreach ($params as $param) {
            if (!isset($_GET[$param]))
                return false;
        }
        return true;
    }

?>