<?php

    if ($_SERVER['REQUEST_METHOD'] == 'GET'){
        if (isset($_GET['searchTerm']) && isset($_GET['ontology']) && isset($_GET["ontologyTwo"])){
            if ($_GET['ontology'] != $_GET['ontologyTwo']) {
                search($_GET['searchTerm'], strtolower($_GET["ontology"]), strtolower($_GET["ontologyTwo"]));   
            }
        }
    }

    function getOntologyJSON($ontologyName, $path){
        if ($ontologyName) {
            try {
                if (!$path)
                    $path = "../ontology_cache";
                if (file_exists("{$path}/{$ontologyName}.json")) {
                    return json_decode(file_get_contents("{$path}/{$ontologyName}.json"), $assoc=true);
                } else {
                    die("Ontology file not found.");
                }
            } catch (Exception $ex) {
                die("Exception occurred while decoding ontology.");
            }
        } else {
            die("Error parsing ontology: {$ontologyName}");
        }
    }

    function getMappingJSON($ontology, $ontology2, $path) {
        if ($ontology && $ontology2) {
            try {
                if (!$path)
                    $path = "../ontology_cache";
                if (file_exists("{$path}/{$ontology}_{$ontology2}_mappings.json")) {
                    return json_decode(file_get_contents("{$path}/{$ontology}_{$ontology2}_mappings.json"), $assoc=true);
                } else if (file_exists("{$path}/{$ontology2}_{$ontology}_mappings.json")) {
                    return json_decode(file_get_contents("{$path}/{$ontology2}_{$ontology}_mappings.json"), $assoc=true);
                } else {
                    die("Ontology mapping not found: {$ontology}_{$ontology2}");
                }
            } catch (Exception $ex) {
                die("Exception occurred while decoding ontology mapping.");
            }
        } else {
            die("Error parsing ontology mapping: {$ontology} {$ontology2}");
        }
    }

    function search($searchTerm, $ontology, $ontology2, $path=null) {
        $json = getOntologyJSON($ontology, $path);
        $json2 = getOntologyJSON($ontology2, $path);

        $result = ["name" => "{$ontology}", "children" => []];
        $ontTwoResult = ["name" => "{$ontology2}", "children" => []];
        $termFound = findNode($json, null, $searchTerm);
        //Iterate through ontology for search term (including synonyms)

        //If term match is found, find it's parent node(s).
        if ($termFound) {
            //Package nodes for d3 rendering
            $parent = findNode($json, $termFound["parent"], null);
            $grandParent = findNode($json, $parent["parent"], null);
            if ($parent){
                array_push($parent["children"], $termFound);
                if ($grandParent){
                    array_push($grandParent["children"], $parent);
                    array_push($result["children"], $grandParent);
                } else {
                    array_push($result["children"], $parent);
                }
            } else {
                array_push($result["children"], $termFound);
            }
            
            //Find matching term in second ontology if possible
            $ontTwoMatchID = findMatch($termFound["ont_id"], getMappingJSON($ontology, $ontology2, $path));
            if ($ontTwoMatchID) {
                $ontTwoTerm = findNode($json2, $ontTwoMatchID, null);
                $ontTwoParent = findNode($json2, $ontTwoTerm["parent"], null);
                $ontTwoGrandParent = findNode($json2, $ontTwoParent["parent"], null);
                if ($ontTwoParent){
                    array_push($ontTwoParent["children"], $ontTwoTerm);
                    if ($ontTwoGrandParent){
                        array_push($ontTwoGrandParent["children"], $ontTwoParent);
                        array_push($ontTwoResult["children"], $ontTwoGrandParent);
                    } else {
                        array_push($ontTwoResult["children"], $ontTwoParent);
                    }
                } else {
                    array_push($ontTwoResult["children"], $ontTwoTerm);
                }
                echo json_encode([$result, $ontTwoResult]);
            } else {
                echo json_encode($result);
            }
            
        } else {
            echo "No match found.";
        }
    }

    function findNode($json, $id, $name) {
        $termFound = null;
        if ($id) {
            $id = strtolower($id);
            foreach ($json["children"] as $term){
                if (strtolower($term["ont_id"]) == $id){
                    $termFound = $term;
                    break;
                } 
            }
        } else if ($name) {
            $name = strtolower($name);
            foreach ($json["children"] as $term){
                if (strtolower($term["name"]) == $name){
                    $termFound = $term;
                    break;
                } else {
                    foreach ($term["synonyms"] as $syn){
                        if ($name == strtolower($syn)){
                            $termFound = $term;
                            break;
                        }
                    }
                }
                if ($termFound)
                    break;
            }
        }
        return $termFound;
    }

    function findMatch($searchTermID, $json) {
        $result = "";
        foreach ($json as $mapping){
            $hp = substr($mapping[0], strrpos($mapping[0], "/") + 1);
            if ($hp == $searchTermID) {
                return substr($mapping[1], strrpos($mapping[1], "/") + 1);
            }

        }


    }

    

?>