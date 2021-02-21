<?php
    include_once 'database.php';
    include_once 'utility.php';

    class Ontology {

        public function __construct(){
            $this->con = new GC_Connection("gc_mouse");
            $this->neo = new Neo_Connection();
        }

        public function search_mouse_term($search) {
            $result = $this->neo->execute("MATCH (N:MP)-[r:LOOM_MAPPING]->(H) WHERE N.FSN =~ '(?i).*{$search}.*' RETURN N.FSN AS Mouse_Label, N.id as Mouse_ID, H.FSN AS Human_Label, H.id AS Human_ID");
            $matches = [];
            foreach ($result as $row) {
                $parsed = ["Mouse_ID"=>$row->value("Mouse_ID"), "Mouse_Label"=>$row->value("Mouse_Label"), "Human_ID"=>$row->value("Human_ID"), "Human_Label"=>$row->value("Human_Label")];
                array_push($matches, $parsed);
            }
            return $matches;
        }

        public function search_human_term($search) {
            $result = $this->neo->execute("MATCH (N)-[r:LOOM_MAPPING]->(H) WHERE (H:HPO OR H:MESH) AND N:MP AND H.FSN =~ '(?i).*{$search}.*' RETURN H.FSN AS Human_Label, H.id as Human_ID, N.FSN AS Mouse_Label, N.id AS Mouse_ID");
            $matches = [];
            foreach ($result as $row) {
                $parsed = ["Mouse_ID"=>$row->value("Mouse_ID"), "Mouse_Label"=>$row->value("Mouse_Label"), "Human_ID"=>$row->value("Human_ID"), "Human_Label"=>$row->value("Human_Label")];
                array_push($matches, $parsed);
            }
            return $matches;
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

        public function get_term_synonyms($termID, $ontology) {
            $ontology = strtoupper($ontology);
            $result = $this->neo->execute("MATCH (N:{$ontology})-[r:HAS_SYNONYM]-(S) WHERE N.id = \"{$termID}\" RETURN S.FSN AS Synonym;");
            $synonyms = [];
            foreach ($result as $row) {
                array_push($synonyms, $row->value("Synonym"));
            }
            return $synonyms;
        }

        public function get_ontology_trees($term, $ontology) {
            $ontology = strtoupper($ontology);
            $termID = "";
            $termLabel = "";
            //search for closest matching term ID
            if ($term !== "GET_ROOT") {
                if ($ontology == "MP") {
                    $match = $this->search_mouse_term($term);
                    if ($match) {
                        $termID = $match[0]["Mouse_ID"];
                        $termLabel = $match[0]["Mouse_Label"];
                    }
                    
                } else {
                    $match = $this->search_human_term($term);
                    if ($match) {
                        $termID = $match[0]["Human_ID"];
                        $termLabel = $match[0]["Human_Label"];
                    }
                }
                if ($termID) {
                    $result = ["sourceTree" => [], "mappedTree" => [], "sourceID" => "", "sourceLabel" => "", "mappedID" => "", "mappedLabel" => "", "isExactMatch" => False];
                    $result["sourceTree"] = $this->search_ontology_hierarchy($termID, $ontology);
                    $result["sourceID"] = $termID;
                    $result["sourceLabel"] = $termLabel;
                    $mapped_term = $this->get_ontology_mappings($termID);             
                    if ($mapped_term) {
                        $result["mappedTree"] = $this->search_ontology_hierarchy($mapped_term[0]["mappedID"], $mapped_term[0]["mappedOnt"]);
                        $result["mappedID"] = $mapped_term[0]["mappedID"];
                        $result["mappedLabel"] = $mapped_term[0]["mappedLabel"];
                        $result["isExactMatch"] = $mapped_term[0]["isExactMatch"];
                    }

                    if ($result["sourceTree"])
                        return $result;
                    else
                        return null;
                }
            } else {
                $result = ["sourceTree" => [], "mappedTree" => [], "sourceID" => "", "mappedID" => "", "isExactMatch" => False];
                $result["sourceTree"] = $this->get_term_children($term, $ontology);
                $result["sourceID"] = $result["sourceTree"]["id"];
                if ($result["sourceTree"])
                    return $result;
                else
                    return null;

            }

            return null;
        }

        private function search_ontology_hierarchy($termID, $ontology) {
            $ontology = strtoupper($ontology);
            $result = null;
            $result = $this->neo->execute(" MATCH p=(root:{$ontology})<-[:ISA*0..]-(child {id: \"{$termID}\"}) WITH COLLECT(p) AS ps CALL apoc.convert.toTree(ps) yield value RETURN value AS tree;");
            
            $return_package = [];
            if (count($result) > 0)
                $return_package = $result[0]->value("tree");
            return $return_package;
        }

        public function get_term_children($termID, $ontology) {
            $ontology = strtoupper($ontology);
            $result = null;
            $root_terms = ["MP"=>"MP:0000001", "HPO"=>"HP:0000001", "MESH"=>""];
            if ($termID == "GET_ROOT")
                $termID = $root_terms[$ontology];
            $result = $this->neo->execute("MATCH p=(root:{$ontology} {id:\"{$termID}\"})<-[:ISA]-(child) WITH COLLECT(p) AS ps CALL apoc.convert.toTree(ps) yield value RETURN value AS tree;");
            if (count($result) > 0)
                $return_package = $result[0]->value("tree");
            return $return_package;
        }

    }

?>