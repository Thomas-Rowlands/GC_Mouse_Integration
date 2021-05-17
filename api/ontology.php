<?php
    include_once 'database.php';
    include_once 'utility.php';
    include_once 'tree.php';
    include_once 'mappings.php';

    class Ontology {

        public function __construct(){
            $this->con = new GC_Connection("gc_mouse");
            $this->neo = new Neo_Connection();
        }

        public function search_mouse_term($search, $mappingOnt) {
            $result = null;
            $search = strtolower($search);
            if ($mappingOnt == "MESH") {
                $result = $this->neo->execute("MATCH (N:MP)-[M:LOOM_MAPPING]->(H:MESH)
                WHERE toLower(N.FSN) STARTS WITH {search}
                WITH N, M, H
                OPTIONAL MATCH (H)<-[:HAS_SYNONYM|:HAS_CONCEPT]-(T {originalType: \"descriptor\"})
                WHERE (H:Synonym)
                WITH N, M, H, T
                OPTIONAL MATCH (N)<-[:HAS_SYNONYM]-(MT)
                WHERE (N:Synonym)
                WITH N, M, H, T, MT
                WHERE (EXISTS(N.id) OR EXISTS(MT.id)) AND (EXISTS(H.id) OR EXISTS(T.id))
                RETURN COALESCE(N.id, MT.id) as mouseID, COALESCE(MT.FSN, N.FSN) as mouseLabel, N.ontology as mouseOnt, M.is_exact_match as isExactMatch, COALESCE(T.id, H.id) as humanID, COALESCE(T.FSN, H.FSN) as humanLabel, H.ontology as humanOnt"
            , ["search"=>$search]);
            } else {
                $result = $this->neo->execute("MATCH (N:MP)-[M:LOOM_MAPPING]->(H:HPO)
                WHERE toLower(N.FSN) STARTS WITH {search}
                WITH N, M, H
                OPTIONAL MATCH (H)<-[:HAS_SYNONYM]-(T)
                WHERE (H:Synonym)
                WITH N, M, H, T
                OPTIONAL MATCH (N)<-[:HAS_SYNONYM]-(MT)
                WHERE (N:Synonym)
                WITH N, M, H, T, MT
                WHERE (EXISTS(N.id) OR EXISTS(MT.id)) AND (EXISTS(H.id) OR EXISTS(T.id))
                RETURN COALESCE(N.id, MT.id) as mouseID, COALESCE(MT.FSN, N.FSN) as mouseLabel, N.ontology as mouseOnt, M.is_exact_match as isExactMatch, COALESCE(T.id, H.id) as humanID, COALESCE(T.FSN, H.FSN) as humanLabel, H.ontology as humanOnt",
            ["search"=>$search]);
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
            $search = strtolower($search);
            if ($ontology == "MESH") {
                $result = $this->neo->execute("MATCH (N:MP)-[M:LOOM_MAPPING]->(H:MESH)
                WHERE toLOWER(H.FSN) STARTS WITH {search}
                WITH N, M, H
                OPTIONAL MATCH (H)<-[:HAS_SYNONYM|:HAS_CONCEPT]-(T {originalType: \"descriptor\"})
                WHERE (H:Synonym)
                WITH N, M, H, T
                OPTIONAL MATCH (N)<-[:HAS_SYNONYM]-(MT)
                WHERE (N:Synonym)
                WITH N, M, H, T, MT
                WHERE (EXISTS(N.id) OR EXISTS(MT.id)) AND (EXISTS(H.id) OR EXISTS(T.id))
                RETURN COALESCE(N.id, MT.id) as mouseID, COALESCE(MT.FSN, N.FSN) as mouseLabel, N.ontology as mouseOnt, M.is_exact_match as isExactMatch, COALESCE(T.id, H.id) as humanID, COALESCE(T.FSN, H.FSN) as humanLabel, H.ontology as humanOnt",
            ["search"=>$search]);
            } else {
                $result = $this->neo->execute("MATCH (N:MP)-[M:LOOM_MAPPING]->(H:HPO)
                WHERE toLower(H.FSN) STARTS WITH {search}
                WITH N, M, H
                OPTIONAL MATCH (H)<-[:HAS_SYNONYM]-(T)
                WHERE (H:Synonym)
                WITH N, M, H, T
                OPTIONAL MATCH (N)<-[:HAS_SYNONYM]-(MT)
                WHERE (N:Synonym)
                WITH N, M, H, T, MT
                WHERE (EXISTS(N.id) OR EXISTS(MT.id)) AND (EXISTS(H.id) OR EXISTS(T.id))
                RETURN COALESCE(N.id, MT.id) as mouseID, COALESCE(MT.FSN, N.FSN) as mouseLabel, N.ontology as mouseOnt, M.is_exact_match as isExactMatch, COALESCE(H.id, T.id) as humanID, COALESCE(T.FSN, H.FSN) as humanLabel, H.ontology as humanOnt",
            ["search"=>$search]);
            }

            $matches = [];
            foreach ($result as $row) {
                $parsed = ["mouseID"=> $row->get("mouseID"), "mouseSynonyms"=>$this->get_term_synonyms($row->get("mouseID"), $row->get("mouseOnt")), "mouseLabel"=> $row->get("mouseLabel"), "mouseOnt"=> $row->get("mouseOnt"), "isExactMatch"=> $row->get("isExactMatch"), "humanID"=> $row->get("humanID"), "humanSynonyms"=>$this->get_term_synonyms($row->get("humanID"), $row->get("humanOnt")),"humanLabel"=> $row->get("humanLabel"), "humanOnt"=> $row->get("humanOnt")];
                array_push($matches, $parsed);
            }
            return $matches;
        }

        public function get_term_synonyms($termID, $ontology) {
            $ontology = $ontology;
            $result = $this->neo->execute("MATCH (N:$ontology)-[r:HAS_SYNONYM]-(S) RETURN ID(S) AS SynonymID, S.FSN AS Synonym;", ["termID"=>$termID]);
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
            $ontLabel = strtoupper($ontology) == "MESH" ? "MESH" : "HP";
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

        public function get_ontology_trees($term, $humanOntology, $mouseOntology, $searchOntology) {
            $humanOntology = strtoupper($humanOntology);
            $mouseOntology = strtoupper($mouseOntology);
            $searchOntology = strtoupper($searchOntology);
            $humanOntLabel = $humanOntology == "MESH" ? "MESH" : "HP";
            $mouseID = "";
            $humanID = "";
            $mouseLabel = "";
            $humanLabel = "";
            $match = null;
            if ($searchOntology == "MP") {
                $match = $this->search_mouse_term($term, $humanOntology);
            } else {
                $match = $this->search_human_term($term, $searchOntology);
            }
            if ($match) {
                $mouseID = $match[0]["mouseID"];
                $mouseLabel = $match[0]["mouseLabel"];
                $humanID = $match[0]["humanID"];
                $humanLabel = $match[0]["humanLabel"];
                
                $result = ["mouseTree" => [], "humanTree" => [], "mouseID" => "", "mouseLabel" => "", "humanID" => "", "humanLabel" => "", "isExactMatch" => False];

                if ($mouseID) {
                    $tree = new OntologyTree($mouseOntology, $mouseOntology, $mouseID, false, $humanOntology);
                    $result["mouseTree"] = $tree->getTree();
                } else {
                    return null;
                }
                    

                if ($humanID) {
                    $tree = null;
                    if ($humanOntology == "MESH") {
                        $tree = new MeshTree($humanID, false);
                    } else {
                        $tree = new OntologyTree($humanOntology, $humanOntLabel, $humanID, false, $mouseOntology);
                    }
                    $result["humanTree"] = $tree->getTree();
                } else {
                    return null;
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

        public function getTermChildren($termID, $ontLabel, $mappingOnt) {
            $ontLabel = strtoupper($ontLabel);
            $mappingOnt = strtoupper($mappingOnt);
            $mappingProperty = $ontLabel == "MP" ? "has" . $mappingOnt . "Mapping" : "hasMPMapping";
            $children = $this->neo->execute("MATCH (n:$ontLabel)<-[:ISA]-(m)
            WHERE n.id = {termID}
            RETURN n.id AS parentID, n.FSN AS parentLabel, m.id AS id, m.FSN AS label, m.$mappingProperty AS hasMapping, m.hasChildren AS hasChildren
            ORDER BY label ASC", ["termID"=>$termID]);

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