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
            $result = $this->neo->execute("MATCH (N:MP)-[r:LOOM_MAPPING]->(H) WHERE H.FSN =~ '(?i).*{$search}.*' RETURN N.FSN AS Mouse_Label, N.id as Mouse_ID, H.FSN AS Human_Label, H.id AS Human_ID");
            $matches = [];
            foreach ($result as $row) {
                $parsed = ["Mouse_ID"=>$row->value("Mouse_ID"), "Mouse_Label"=>$row->value("Mouse_Label"), "Human_ID"=>$row->value("Human_ID"), "Human_Label"=>$row->value("Human_Label")];
                array_push($matches, $parsed);
            }
            return $matches;
        }

        public function get_ontology_mappings($termID) {
            $result = $this->neo->execute("MATCH (N)-[M:LOOM_MAPPING]->(H) WHERE N.id = \"{$termID}\" RETURN N.id as mouseID, N.FSN as mouseLabel, N.ontology as mouseOnt, M.is_exact_match as isExactMatch, H.id as humanID, H.FSN as humanLabel, H.ontology as humanOnt");
            $mappings = [];
            foreach ($result as $row) {
                $parsed = ["mouseID"=> $row->value("mouseID"), "mouseSynonyms"=>$this->get_term_synonyms($row->value("mouseID"), $row->value("mouseOnt")), "mouseLabel"=> $row->value("mouseLabel"), "mouseOnt"=> $row->value("mouseOnt"), "isExactMatch"=> $row->value("isExactMatch"), "humanID"=> $row->value("humanID"), "humanSynonyms"=>$this->get_term_synonyms($row->value("humanID"), $row->value("humanOnt")),"humanLabel"=> $row->value("humanLabel"), "humanOnt"=> $row->value("humanOnt")];
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
                    $result = ["mouseTree" => [], "humanTree" => [], "mouseID" => "", "mouseLabel" => "", "humanID" => "", "humanLabel" => "", "isExactMatch" => False];
                    $result["mouseTree"] = $this->search_ontology_hierarchy($termID, $ontology);
                    $result["mouseID"] = $termID;
                    $result["mouseLabel"] = $termLabel;
                    $human_term = $this->get_ontology_mappings($termID);             
                    if ($human_term) {
                        $result["humanTree"] = $this->search_ontology_hierarchy($human_term[0]["humanID"], $human_term[0]["humanOnt"]);
                        $result["humanID"] = $human_term[0]["humanID"];
                        $result["humanLabel"] = $human_term[0]["humanLabel"];
                        $result["isExactMatch"] = $human_term[0]["isExactMatch"];
                    }

                    if ($result["mouseTree"])
                        return $result;
                    else
                        return null;
                }
            } else {
                $result = ["mouseTree" => [], "humanTree" => [], "mouseID" => "", "humanID" => "", "isExactMatch" => False];
                $result["mouseTree"] = $this->get_term_children($term, "MP");
                $result["humanTree"] = $this->get_term_children($term, "HPO");
                $result["mouseID"] = $result["mouseTree"]["id"];
                $result["humanID"] = $result["humanTree"]["id"];
                if ($result["mouseTree"])
                    return $result;
                else
                    return null;

            }

            return null;
        }

        private function search_ontology_hierarchy($termID, $ontology) {
            $ontology = strtoupper($ontology);
            $result = null;
            $cmd = "";
            if (strtolower($ontology) == "mp") {
                $cmd = "MATCH (mapping)<-[:LOOM_MAPPING*0..]-(parent:{$ontology})<-[:ISA*1..]-(child {id: \"{$termID}\"})-[:LOOM_MAPPING*0..]->(targetMapping)
                WITH parent, child
                ORDER BY parent.FSN, child.FSN
                MATCH p=(mapping)<-[:LOOM_MAPPING*0..]-(parent:{$ontology})<-[:ISA*0..]-(child {id: \"{$termID}\"})-[:LOOM_MAPPING*0..]->(targetMapping)
                WHERE \"mammalian phenotype\" in parent.FSN
                WITH COLLECT(p) AS ps 
                CALL apoc.convert.toTree(ps) yield value 
                RETURN value AS tree;";
            } else {
                $cmd = "MATCH (mapping)<-[:LOOM_MAPPING*0..]-(parent:{$ontology})<-[:ISA*1..]-(child {id: \"{$termID}\"})-[:LOOM_MAPPING*0..]->(targetMapping)
                WITH parent, child
                ORDER BY parent.FSN, child.FSN
                MATCH p=(mapping)<-[:LOOM_MAPPING*0..]-(parent:{$ontology})<-[:ISA*0..]-(child {id: \"{$termID}\"})-[:LOOM_MAPPING*0..]->(targetMapping)
                WHERE \"All\" in parent.FSN
                WITH COLLECT(p) AS ps 
                CALL apoc.convert.toTree(ps) yield value 
                RETURN value AS tree;";
            }

            $result = $this->neo->execute($cmd);
            $return_package = [];
            if (count($result) > 0)
                $return_package = end($result)->value("tree");
            return $return_package;
        }

        public function get_term_children($termID, $ontology) {
            $ontology = strtoupper($ontology);
            $result = null;
            $root_terms = ["MP"=>"MP:0000001", "HPO"=>"HP:0000001", "MESH"=>""];
            if ($termID == "GET_ROOT")
                $termID = $root_terms[$ontology];
            $cmd = "MATCH (mapping)<-[:LOOM_MAPPING*0..]-(parent:{$ontology}{id:\"{$termID}\"})<-[:ISA]-(child)-[:LOOM_MAPPING*0..]->(targetMapping) 
            WITH parent, child
            ORDER BY parent.FSN, child.FSN
            MATCH p=(mapping)<-[:LOOM_MAPPING*0..]-(parent:{$ontology}{id:\"{$termID}\"})<-[:ISA]-(child)-[:LOOM_MAPPING*0..]->(targetMapping) 
            WITH COLLECT(p) AS ps  
            CALL apoc.convert.toTree(ps) yield value 
            RETURN value AS tree;";
            $result = $this->neo->execute($cmd);
            if (count($result) > 0) {
                $return_package = $result[0]->value("tree");
            }
                
            return $return_package;
        }

    }

?>