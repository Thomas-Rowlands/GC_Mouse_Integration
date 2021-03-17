<?php
    include_once 'database.php';
    include_once 'utility.php';

    class Ontology {

        public function __construct(){
            $this->con = new GC_Connection("gc_mouse");
            $this->neo = new Neo_Connection();
        }

        public function search_mouse_term($search) {
            $result = $this->neo->execute("MATCH (N:MP)-[M:LOOM_MAPPING]->(H) WHERE N.FSN =~ '(?i).*{$search}.*' RETURN N.id as mouseID, N.FSN as mouseLabel, N.ontology as mouseOnt, M.is_exact_match as isExactMatch, H.id as humanID, H.FSN as humanLabel, H.ontology as humanOnt");
            $matches = [];
            foreach ($result as $row) {
                $parsed = ["mouseID"=> $row->get("mouseID"), "mouseSynonyms"=>$this->get_term_synonyms($row->get("mouseID"), $row->get("mouseOnt")), "mouseLabel"=> $row->get("mouseLabel"), "mouseOnt"=> $row->get("mouseOnt"), "isExactMatch"=> $row->get("isExactMatch"), "humanID"=> $row->get("humanID"), "humanSynonyms"=>$this->get_term_synonyms($row->get("humanID"), $row->get("humanOnt")),"humanLabel"=> $row->get("humanLabel"), "humanOnt"=> $row->get("humanOnt")];
                array_push($matches, $parsed);
            }
            return $matches;
        }

        public function search_human_term($search) {
            $result = $this->neo->execute("MATCH (N:MP)-[M:LOOM_MAPPING]->(H) WHERE H.FSN =~ '(?i).*{$search}.*' RETURN N.id as mouseID, N.FSN as mouseLabel, N.ontology as mouseOnt, M.is_exact_match as isExactMatch, H.id as humanID, H.FSN as humanLabel, H.ontology as humanOnt");
            $matches = [];
            foreach ($result as $row) {
                $parsed = ["mouseID"=> $row->get("mouseID"), "mouseSynonyms"=>$this->get_term_synonyms($row->get("mouseID"), $row->get("mouseOnt")), "mouseLabel"=> $row->get("mouseLabel"), "mouseOnt"=> $row->get("mouseOnt"), "isExactMatch"=> $row->get("isExactMatch"), "humanID"=> $row->get("humanID"), "humanSynonyms"=>$this->get_term_synonyms($row->get("humanID"), $row->get("humanOnt")),"humanLabel"=> $row->get("humanLabel"), "humanOnt"=> $row->get("humanOnt")];
                array_push($matches, $parsed);
            }
            return $matches;
        }

        public function get_ontology_mappings($termID, $isMouse=true) {
            $result = null;
            if ($isMouse)
                $result = $this->neo->execute("MATCH (N)-[M:LOOM_MAPPING]->(H) WHERE N.id = \"{$termID}\" RETURN N.id as mouseID, N.FSN as mouseLabel, N.ontology as mouseOnt, M.is_exact_match as isExactMatch, H.id as humanID, H.FSN as humanLabel, H.ontology as humanOnt");
            else
                $result = $this->neo->execute("MATCH (N)-[M:LOOM_MAPPING]->(H) WHERE H.id = \"{$termID}\" RETURN N.id as mouseID, N.FSN as mouseLabel, N.ontology as mouseOnt, M.is_exact_match as isExactMatch, H.id as humanID, H.FSN as humanLabel, H.ontology as humanOnt");
            $mappings = [];
            foreach ($result as $row) {
                $parsed = ["mouseID"=> $row->get("mouseID"), "mouseSynonyms"=>$this->get_term_synonyms($row->get("mouseID"), $row->get("mouseOnt")), "mouseLabel"=> $row->get("mouseLabel"), "mouseOnt"=> $row->get("mouseOnt"), "isExactMatch"=> $row->get("isExactMatch"), "humanID"=> $row->get("humanID"), "humanSynonyms"=>$this->get_term_synonyms($row->get("humanID"), $row->get("humanOnt")),"humanLabel"=> $row->get("humanLabel"), "humanOnt"=> $row->get("humanOnt")];
                array_push($mappings, $parsed);
            }
            return $mappings;
        }

        public function get_term_synonyms($termID, $ontology) {
            $ontology = strtoupper($ontology);
            $result = $this->neo->execute("MATCH (N:{$ontology})-[r:HAS_SYNONYM]-(S) WHERE N.id = \"{$termID}\" RETURN S.FSN AS Synonym;");
            $synonyms = [];
            foreach ($result as $row) {
                array_push($synonyms, $row->get("Synonym"));
            }
            return $synonyms;
        }

        public function get_ontology_trees($term, $ontology) {
            $ontology = strtoupper($ontology);
            //search for closest matching term ID
            if ($term !== "GET_ROOT") {
                $mouseID = "";
                $humanID = "";
                $mouseLabel = "";
                $humanLabel = "";
                $match = null;
                if ($ontology == "MP") {
                    $match = $this->search_mouse_term($term);
                } else {
                    $match = $this->search_human_term($term);
                }
                if ($match) {
                    $mouseID = $match[0]["mouseID"];
                    $mouseLabel = $match[0]["mouseLabel"];
                    $humanID = $match[0]["humanID"];
                    $humanLabel = $match[0]["humanLabel"];

                    $result = ["mouseTree" => [], "humanTree" => [], "mouseID" => "", "mouseLabel" => "", "humanID" => "", "humanLabel" => "", "isExactMatch" => False];
                    
                    if ($mouseID)
                        $result["mouseTree"] = $this->search_ontology_hierarchy($mouseID, "MP");

                    if ($humanID)
                        $result["humanTree"] = $this->search_ontology_hierarchy($humanID, "HPO");

                    $result["mouseID"] = $mouseID;
                    $result["mouseLabel"] = $mouseLabel;
                    $result["humanID"] = $humanID;
                    $result["humanLabel"] = $humanLabel;
                    $result["isExactMatch"] = $match[0]["isExactMatch"];


                    if ($result["mouseTree"] || $result["humanTree"])
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
                // $cmd = "MATCH (mapping)<-[:LOOM_MAPPING*0..]-(parent:{$ontology})<-[:ISA*1..]-(child {id: \"{$termID}\"})-[:LOOM_MAPPING*0..]->(targetMapping)
                // WITH parent, child
                // ORDER BY parent.FSN, child.FSN
                // MATCH p=(mapping)<-[:LOOM_MAPPING*0..]-(parent:{$ontology})<-[:ISA*1..]-(child {id: \"{$termID}\"})-[:LOOM_MAPPING*0..]->(targetMapping)
                // WHERE \"mammalian phenotype\" in parent.FSN
                // WITH COLLECT(p) AS ps 
                // CALL apoc.convert.toTree(ps) yield value 
                // RETURN value AS tree;";
                $cmd = "MATCH a=(endNode:MP{id: \"$termID\"})-[:ISA*1..]->(startNode:MP{id: 'MP:0000001'})
                WITH NODES(a) AS aNodes, startNode
                MATCH b=(startNode)<-[:ISA*1..]-(test)-[:hasSibling*0..1]->(sibs)
                WHERE test in aNodes
                WITH b, test, sibs
                ORDER BY test.FSN, sibs.FSN
                WITH COLLECT(b) AS paths
                CALL apoc.convert.toTree(paths) YIELD value AS tree
                RETURN tree";
            } else {
                // $cmd = "MATCH (mapping)-[:LOOM_MAPPING*0..]->(parent:{$ontology})<-[:ISA*1..]-(child {id: \"{$termID}\"})<-[:LOOM_MAPPING*0..]-(targetMapping)
                // WITH parent, child
                // ORDER BY parent.FSN, child.FSN
                // MATCH p=(mapping)-[:LOOM_MAPPING*0..]->(parent:{$ontology})<-[:ISA*1..]-(child {id: \"{$termID}\"})<-[:LOOM_MAPPING*0..]-(targetMapping)
                // WHERE \"All\" in parent.FSN
                // WITH COLLECT(p) AS ps 
                // CALL apoc.convert.toTree(ps) yield value 
                // RETURN value AS tree;";
                $cmd = "MATCH a=(endNode:HPO{id: \"$termID\"})-[:ISA*1..]->(startNode:HPO{id: 'HP:0000001'})
                WITH NODES(a) AS aNodes, startNode
                MATCH b=(startNode)<-[:ISA*1..]-(test)-[:hasSibling*0..1]->(sibs)
                WHERE test in aNodes
                WITH b, test, sibs
                ORDER BY test.FSN, sibs.FSN
                WITH COLLECT(b) AS paths
                CALL apoc.convert.toTree(paths) YIELD value AS tree
                RETURN tree";
            }
            
            $result = $this->neo->execute($cmd);
            $return_package = [];
            if (count($result) > 0) {
                $return_package = $result[0]->get("tree");
            }
            return $return_package;
        }

        public function get_term_children($termID, $ontology) {
            $ontology = strtoupper($ontology);
            $result = null;
            $root_terms = ["MP"=>"MP:0000001", "HPO"=>"HP:0000001"];
            if ($termID == "GET_ROOT")
                $termID = $root_terms[$ontology];
            if ($ontology == "MP") {
                $cmd = "MATCH (mapping)<-[:LOOM_MAPPING*0..]-(parent:{$ontology}{id:\"{$termID}\"})<-[:ISA]-(child)-[:LOOM_MAPPING*0..]->(targetMapping) 
                WITH parent, child
                ORDER BY parent.FSN, child.FSN
                MATCH p=(mapping)<-[:LOOM_MAPPING*0..]-(parent:{$ontology}{id:\"{$termID}\"})<-[:ISA]-(child)-[:LOOM_MAPPING*0..]->(targetMapping) 
                WITH COLLECT(p) AS ps  
                CALL apoc.convert.toTree(ps) yield value 
                RETURN value AS tree;";
            } else {
                $cmd = "MATCH (mapping)-[:LOOM_MAPPING*0..]->(parent:{$ontology}{id:\"{$termID}\"})<-[:ISA]-(child)<-[:LOOM_MAPPING*0..]-(targetMapping) 
                WITH parent, child
                ORDER BY parent.FSN, child.FSN
                MATCH p=(mapping)-[:LOOM_MAPPING*0..]->(parent:{$ontology}{id:\"{$termID}\"})<-[:ISA]-(child)<-[:LOOM_MAPPING*0..]-(targetMapping) 
                WITH COLLECT(p) AS ps  
                CALL apoc.convert.toTree(ps) yield value 
                RETURN value AS tree;";
            }
            $result = $this->neo->execute($cmd);
            if (count($result) > 0) {
                $return_package = $result[0]->get("tree");
            }
                
            return $return_package;
        }

    }

?>