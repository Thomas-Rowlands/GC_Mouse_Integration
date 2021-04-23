<?php
    include_once 'database.php';
    include_once 'utility.php';
    include_once 'tree.php';

    class Ontology {

        public function __construct(){
            $this->con = new GC_Connection("gc_mouse");
            $this->neo = new Neo_Connection();
        }

        public function search_mouse_term($search, $mappingOnt) {
            $result = null;
            if ($mappingOnt == "MESH") {
                $result = $this->neo->execute("MATCH (N:MP)-[M:LOOM_MAPPING]->(H:MESH)
                WHERE N.FSN =~ '(?i).*{$search}.*'
                WITH N, M, H
                OPTIONAL MATCH (H)<-[:HAS_SYNONYM]-(T)
                WHERE (H:Synonym)
                WITH N, M, H, T
                OPTIONAL MATCH (N)<-[:HAS_SYNONYM]-(MT)
                WHERE (N:Synonym)
                WITH N, M, H, T, MT
                WHERE (EXISTS(N.id) OR EXISTS(MT.id)) AND (EXISTS(H.id) OR EXISTS(T.id))
                RETURN COALESCE(N.id, MT.id) as mouseID, COALESCE(MT.FSN, N.FSN) as mouseLabel, N.ontology as mouseOnt, M.is_exact_match as isExactMatch, COALESCE(H.id, T.id) as humanID, COALESCE(T.FSN, H.FSN) as humanLabel, H.ontology as humanOnt");
            } else {
                $result = $this->neo->execute("MATCH (N:MP)-[M:LOOM_MAPPING]->(H:HPO)
                WHERE N.FSN =~ '(?i).*{$search}.*'
                WITH N, M, H
                OPTIONAL MATCH (H)<-[:HAS_SYNONYM]-(T)
                WHERE (H:Synonym)
                WITH N, M, H, T
                OPTIONAL MATCH (N)<-[:HAS_SYNONYM]-(MT)
                WHERE (N:Synonym)
                WITH N, M, H, T, MT
                WHERE (EXISTS(N.id) OR EXISTS(MT.id)) AND (EXISTS(H.id) OR EXISTS(T.id))
                RETURN COALESCE(N.id, MT.id) as mouseID, COALESCE(MT.FSN, N.FSN) as mouseLabel, N.ontology as mouseOnt, M.is_exact_match as isExactMatch, COALESCE(H.id, T.id) as humanID, COALESCE(T.FSN, H.FSN) as humanLabel, H.ontology as humanOnt");
            }

            $matches = [];
            foreach ($result as $row) {
                $parsed = ["mouseID"=> $row->get("mouseID"), "mouseSynonyms"=>$this->get_term_synonyms($row->get("mouseID"), $row->get("mouseOnt")), "mouseLabel"=> $row->get("mouseLabel"), "mouseOnt"=> $row->get("mouseOnt"), "isExactMatch"=> $row->get("isExactMatch"), "humanID"=> $row->get("humanID"), "humanSynonyms"=>$this->get_term_synonyms($row->get("humanID"), $row->get("humanOnt")),"humanLabel"=> $row->get("humanLabel"), "humanOnt"=> $row->get("humanOnt")];
                array_push($matches, $parsed);
            }
            return $matches;
        }

        public function search_human_term($search, $ontology) {
            $result = null;
            if ($ontology == "MESH") {
                $result = $this->neo->execute("MATCH (N:MP)-[M:LOOM_MAPPING]->(H:MESH)
                WHERE H.FSN =~ '(?i).*{$search}.*'
                WITH N, M, H
                OPTIONAL MATCH (H)<-[:HAS_SYNONYM]-(T)
                WHERE (H:Synonym)
                WITH N, M, H, T
                OPTIONAL MATCH (N)<-[:HAS_SYNONYM]-(MT)
                WHERE (N:Synonym)
                WITH N, M, H, T, MT
                WHERE (EXISTS(N.id) OR EXISTS(MT.id)) AND (EXISTS(H.id) OR EXISTS(T.id))
                RETURN COALESCE(N.id, MT.id) as mouseID, COALESCE(MT.FSN, N.FSN) as mouseLabel, N.ontology as mouseOnt, M.is_exact_match as isExactMatch, COALESCE(H.id, T.id) as humanID, COALESCE(T.FSN, H.FSN) as humanLabel, H.ontology as humanOnt");
            } else {
                $result = $this->neo->execute("MATCH (N:MP)-[M:LOOM_MAPPING]->(H:HPO)
                WHERE H.FSN =~ '(?i).*{$search}.*'
                WITH N, M, H
                OPTIONAL MATCH (H)<-[:HAS_SYNONYM]-(T)
                WHERE (H:Synonym)
                WITH N, M, H, T
                OPTIONAL MATCH (N)<-[:HAS_SYNONYM]-(MT)
                WHERE (N:Synonym)
                WITH N, M, H, T, MT
                WHERE (EXISTS(N.id) OR EXISTS(MT.id)) AND (EXISTS(H.id) OR EXISTS(T.id))
                RETURN COALESCE(N.id, MT.id) as mouseID, COALESCE(MT.FSN, N.FSN) as mouseLabel, N.ontology as mouseOnt, M.is_exact_match as isExactMatch, COALESCE(H.id, T.id) as humanID, COALESCE(T.FSN, H.FSN) as humanLabel, H.ontology as humanOnt");
            }

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
                // $result = $this->neo->execute("MATCH (N)-[M:LOOM_MAPPING]->(H) WHERE N.id = \"{$termID}\" RETURN N.id as mouseID, N.FSN as mouseLabel, N.ontology as mouseOnt, M.is_exact_match as isExactMatch, M.is_synonym_match as isSynonymMatch, H.id as humanID, H.FSN as humanLabel, H.ontology as humanOnt");
                $result = $this->neo->execute("MATCH (mouseTerm:MP{id:\"$termID\"})-[:HAS_SYNONYM*0..]->(mouseSyn)
                WITH mouseTerm, COLLECT(mouseSyn) AS mouseSyns
                MATCH (N)-[M:LOOM_MAPPING]->(H)
                WHERE N = mouseTerm or N in mouseSyns
                WITH N, M, H, mouseTerm
                OPTIONAL MATCH (H)<-[:HAS_SYNONYM]-(humanTerm)
                WITH N, M, H, humanTerm, mouseTerm
                RETURN ID(N) as mouseNodeId, mouseTerm.id as mouseID, N.originalType as mouseType, N.FSN as mouseLabel, N.ontology as mouseOnt, M.is_exact_match as isExactMatch, COALESCE(H.id, humanTerm.id) as humanID, H.FSN as humanLabel, H.ontology as humanOnt, ID(H) as humanNodeId, H.originalType as humanType");
            else
                $result = $this->neo->execute("MATCH (humanTerm:HPO{id:\"$termID\"})-[:HAS_SYNONYM*0..]->(humanSyn)
                WITH humanTerm, COLLECT(humanSyn) AS humanSyns
                MATCH (N)-[M:LOOM_MAPPING]->(H)
                WHERE H = humanTerm or H in humanSyns
                WITH N, M, H, humanTerm
                OPTIONAL MATCH (N)<-[:HAS_SYNONYM]-(mouseTerm)
                WITH N, M, H, mouseTerm, humanTerm
                RETURN ID(N) as mouseNodeId, mouseTerm.id as mouseID, N.originalType as mouseType, N.FSN as mouseLabel, N.ontology as mouseOnt, M.is_exact_match as isExactMatch, COALESCE(H.id, humanTerm.id) as humanID, H.FSN as humanLabel, H.ontology as humanOnt, ID(H) as humanNodeId, H.originalType as humanType");
            $mappings = [];
            $term_mapping_retrieved = false;
            foreach ($result as $row) {
                if (!$term_mapping_retrieved) {
                    $mappings = ["mouseID"=> $row->get("mouseID"), "mouseSynonyms"=>$this->get_term_synonyms($row->get("mouseID"), $row->get("mouseOnt")), "mouseLabel"=> $row->get("mouseLabel"), "mouseOnt"=> $row->get("mouseOnt"), "isExactMatch"=> $row->get("isExactMatch"), "humanID"=> $row->get("humanID"), "humanSynonyms"=>$this->get_term_synonyms($row->get("humanID"), $row->get("humanOnt")),"humanLabel"=> $row->get("humanLabel"), "humanOnt"=> $row->get("humanOnt"), "matches" => []];
                    $term_mapping_retrieved = true;
                }
                $match = ["mouseNodeId" => $row->get("mouseNodeId"), "mouseNodeType" => $row->get("mouseType"), "mouseLabel" => $row->get("mouseLabel"), "isExact" => $row->get("isExactMatch"), "humanNodeId" => $row->get("humanNodeId"), "humanNodeType" => $row->get("humanType"), "humanLabel" => $row->get("humanLabel")];
                array_push($mappings["matches"], $match);
            }
            return $mappings;
        }

        public function get_term_synonyms($termID, $ontology) {
            $ontology = strtoupper($ontology);
            $result = $this->neo->execute("MATCH (N:{$ontology})-[r:HAS_SYNONYM]-(S) WHERE N.id = \"{$termID}\" RETURN ID(S) AS SynonymID, S.FSN AS Synonym;");
            $synonyms = [];
            foreach ($result as $row) {
                array_push($synonyms, ["synonymId" => $row->get("SynonymID"), "synonymLabel" => $row->get("Synonym")]);
            }
            return $synonyms;
        }

        public function get_root_ontology_tree($ontology, $mappingOnt) {
            $ontLabel = "";
            if ($ontology == "MP")
                $ontLabel = "MP";
            else
                $ontLabel = $ontology === "MESH" ? "MESH" : "HP";
            $result = ["tree" => []];
            if ($ontLabel == "MP") {
                $mouseOntTree = new OntologyTree("MP", "MP", null, true, $ontLabel);
                $result["tree"] = $mouseOntTree->getTree();
                $result["ID"] = $result["tree"]->id;
                return $result;
            } else {
                $humanOntTree = new OntologyTree($ontology, $ontLabel, null, true, "MP");
                $result["tree"] = $humanOntTree->getTree();
                $result["ID"] = $result["tree"]->id;
                return $result;
            }
        }

        public function get_root_ontology_trees($ontology) {
            $ontLabel = $ontology === "MESH" ? "MESH" : "HP";
            $result = ["mouseTree" => [], "humanTree" => [], "mouseID" => "", "humanID" => "", "isExactMatch" => False];
            $mouseOntTree = new OntologyTree("MP", "MP", null, true, $ontLabel);
            $humanOntTree = null;

            if ($ontology == "MESH")
                $humanOntTree = new MeSHTree(null, true);
            else
                $humanOntTree = new OntologyTree($ontology, $ontLabel, null, true, "MP");
            $result["mouseTree"] = $mouseOntTree->getTree();
            $result["humanTree"] = $humanOntTree->getTree();
            $result["mouseID"] = $result["mouseTree"]->id;
            $result["humanID"] = $result["humanTree"]->id;
            if ($result)
                return $result;
            else
                return null;
        }

        public function get_ontology_trees($term, $ontology, $mappingOnt) {
            $ontology = strtoupper($ontology);
            $mappingOnt = strtoupper($mappingOnt);
            $ontLabel = $mappingOnt === "MESH" ? "MESH" : "HP";
            $mouseID = "";
            $humanID = "";
            $mouseLabel = "";
            $humanLabel = "";
            $match = null;
            if ($ontology == "MP") {
                $match = $this->search_mouse_term($term, $mappingOnt);
            } else {
                $match = $this->search_human_term($term, $ontology);
            }
            if ($match) {
                $mouseID = $match[0]["mouseID"];
                $mouseLabel = $match[0]["mouseLabel"];
                $humanID = $match[0]["humanID"];
                $humanLabel = $match[0]["humanLabel"];
                
                $result = ["mouseTree" => [], "humanTree" => [], "mouseID" => "", "mouseLabel" => "", "humanID" => "", "humanLabel" => "", "isExactMatch" => False];
                
                if ($mouseID) {
                    $tree = new OntologyTree("MP", "MP", $mouseID, false, $ontLabel);
                    $result["mouseTree"] = $tree->getTree();
                }
                    

                if ($humanID) {
                    $tree = new OntologyTree($mappingOnt, $ontLabel, $humanID, false, "MP");
                    $result["humanTree"] = $tree->getTree();
                }
                    

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

            return null;
        }

        private function search_ontology_hierarchy($termID, $ontology) {
            $ontology = strtoupper($ontology);
            $ontLabel = str_replace( "O", "", $ontology);
            $tree = new OntologyTree($ontology, $ontLabel, $termID);
            return $tree->getTree();
        }

        public function getTermChildren($termID, $ontLabel) {
            $ontLabel = strtoupper($ontLabel);
            $mappingProperty = $ontLabel == "HPO" ? "hasMPMapping" : "hasHPOMapping";
            $children = $this->neo->execute("MATCH (n:$ontLabel {id: \"$termID\"})<-[:ISA]-(m)
            RETURN n.id AS parentID, n.FSN AS parentLabel, m.id AS id, m.FSN AS label, m.$mappingProperty AS hasMapping, m.hasChildren AS hasChildren
            ORDER BY label ASC");
            $return_package = [];
            foreach ($children as $child) {
                $hasMapping = false;
                if ($child->hasValue("hasMapping"))
                    $hasMapping = $child->get('hasMapping');
                $childNode = new TreeNode($child->get('id'), $child->get('label'), $hasMapping, $child->get('hasChildren'));
                $return_package[$child->get('id')] = $childNode;
            }
            return $return_package;
        }

    }

?>