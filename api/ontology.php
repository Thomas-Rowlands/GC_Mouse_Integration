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

        public function search_mouse_term($search, $mappingOnt, $is_open_search=false) {
            $result = null;
            $ont = strtoupper($mappingOnt);
            $search = strtolower($search);
                if ($is_open_search) {
                    $result = $this->neo->execute("MATCH (N:MP)-[M:LOOM_MAPPING]->(H:".$mappingOnt.")
                    WITH N, M, H
                    OPTIONAL MATCH (H)<-[:HAS_SYNONYM]-(T)
                    WHERE (H:Synonym)
                    WITH N, M, H, T
                    OPTIONAL MATCH (N)<-[:HAS_SYNONYM]-(MT)
                    WHERE (N:Synonym)
                    WITH N, M, H, T, MT
                    WHERE (EXISTS(N.id) OR EXISTS(MT.id)) AND (EXISTS(H.id) OR EXISTS(T.id)) AND (N.experiment_total > 0) AND (toLOWER(N.FSN) STARTS WITH {search} OR toLOWER(N.FSN) CONTAINS {searchContains})
                    RETURN COALESCE(N.id, MT.id) as mouseID, COALESCE(MT.FSN, N.FSN) as mouseLabel, COALESCE(N.experiment_total, MT.experiment_total) AS Experiments, N.ontology as mouseOnt, M.is_exact_match as isExactMatch, COALESCE(T.id, H.id) as humanID, COALESCE(T.gwas_total, H.gwas_total) AS GWAS, COALESCE(T.FSN, H.FSN) as humanLabel, H.ontology as humanOnt
                    
                    UNION

                    MATCH (n:MP)-[:HAS_SYNONYM*0..1]->(m)
                        WHERE (toLOWER(n.FSN) STARTS WITH {search} OR toLOWER(m.FSN) STARTS WITH {search} OR toLOWER(n.FSN) CONTAINS {searchContains} OR toLOWER(m.FSN) CONTAINS {searchContains}) AND n.experiment_total > 0 AND EXISTS(n.id)
                        RETURN n.id as mouseID, n.FSN as mouseLabel, n.experiment_total AS Experiments, n.ontology as mouseOnt, null as isExactMatch, null as humanID, null AS GWAS, null as humanLabel, null as humanOnt
                    ",
                    ["search"=>$search, "searchContains"=>" " . $search]);
                } else {
                    $result = $this->neo->execute("MATCH (N:MP)-[M:LOOM_MAPPING]->(H:".$mappingOnt.")
                    WHERE toLOWER(N.FSN) STARTS WITH {search}
                    WITH N, M, H
                    OPTIONAL MATCH (H)<-[:HAS_SYNONYM]-(T)
                    WHERE (H:Synonym)
                    WITH N, M, H, T
                    OPTIONAL MATCH (N)<-[:HAS_SYNONYM]-(MT)
                    WHERE (N:Synonym)
                    WITH N, M, H, T, MT
                    WHERE (EXISTS(N.id) OR EXISTS(MT.id)) AND (EXISTS(H.id) OR EXISTS(T.id))
                    RETURN COALESCE(N.id, MT.id) as mouseID, COALESCE(MT.FSN, N.FSN) as mouseLabel, COALESCE(N.experiment_total, MT.experiment_total) AS Experiments, N.ontology as mouseOnt, M.is_exact_match as isExactMatch, COALESCE(T.id, H.id) as humanID, COALESCE(T.gwas_total, H.gwas_total) AS GWAS, COALESCE(T.FSN, H.FSN) as humanLabel, H.ontology as humanOnt",
                ["search"=>$search]);
                }
            
            $matches = [];
            foreach ($result as $row) {
                $gwas = $row->get("GWAS");
                $experiments = $row->get("Experiments");

                if (!$gwas)
                    $gwas = 0;
                if (!$experiments)
                    $experiments = 0;
                $humanID = $row->get("humanID");
                $humanOnt = $humanID ? $row->get("humanOnt") : null;
                $humanSyns = $humanID ? $this->get_term_synonyms($row->get("humanID"), $humanOnt) : null;
                $humanLabel = $humanID ? $row->get("humanLabel") : null;
                $parsed = ["mouseID"=> $row->get("mouseID"), "mouseSynonyms"=>$this->get_term_synonyms($row->get("mouseID"), $row->get("mouseOnt")), "mouseLabel"=> $row->get("mouseLabel"), "experiments"=>$experiments, "mouseOnt"=> $row->get("mouseOnt"), "isExactMatch"=> $row->get("isExactMatch"), "gwas"=>$gwas, "humanID"=> $row->get("humanID"), "humanSynonyms"=>$humanSyns,"humanLabel"=> $humanLabel, "humanOnt"=> $humanOnt];
                array_push($matches, $parsed);
            }
            return $matches;
        }

        public function search_human_term($search, $ontology, $is_open_search=false) {
            $result = null;
            $ont = strtoupper($ontology);
            $search = strtolower($search);
                if ($is_open_search) {
                    $result = $this->neo->execute("MATCH (N:MP)-[M:LOOM_MAPPING]->(H:".$ont.")
                        WHERE toLOWER(H.FSN) STARTS WITH {search}
                        WITH N, M, H
                    OPTIONAL MATCH (H)<-[:HAS_SYNONYM]-(T)
                        WHERE (H:Synonym)
                        WITH N, M, H, T
                    OPTIONAL MATCH (N)<-[:HAS_SYNONYM]-(MT)
                        WHERE (N:Synonym)
                        WITH N, M, H, T, MT
                        WHERE (EXISTS(N.id) OR EXISTS(MT.id)) AND (EXISTS(H.id) OR EXISTS(T.id)) AND (T.gwas_total > 0 OR H.gwas_total > 0)
                    RETURN COALESCE(N.id, MT.id) as mouseID, COALESCE(MT.FSN, N.FSN) as mouseLabel, COALESCE(N.experiment_total, MT.experiment_total) AS Experiments, N.ontology as mouseOnt, M.is_exact_match as isExactMatch, COALESCE(H.id, T.id) as humanID, COALESCE(T.gwas_total, H.gwas_total) AS GWAS, COALESCE(T.FSN, H.FSN) as humanLabel, H.ontology as humanOnt
                    
                    UNION

                    MATCH (n:HPO)-[:HAS_SYNONYM*0..1]->(m)
                        WHERE (toLOWER(n.FSN) STARTS WITH {search} OR toLOWER(m.FSN) STARTS WITH {search} OR toLOWER(n.FSN) CONTAINS {searchContains} OR toLOWER(m.FSN) CONTAINS {searchContains}) AND n.gwas_total > 0 AND EXISTS(n.id)
                        RETURN null as mouseID, null as mouseLabel, null AS Experiments, null as mouseOnt, null as isExactMatch, n.id as humanID, n.gwas_total AS GWAS, n.FSN as humanLabel, n.ontology as humanOnt
                        ",
                    ["search"=>$search, "searchContains"=>" " . $search]);
                } else {
                    $result = $this->neo->execute("MATCH (N:MP)-[M:LOOM_MAPPING]->(H:".$ont.")
                    WHERE toLOWER(H.FSN) STARTS WITH {search}
                    WITH N, M, H
                    OPTIONAL MATCH (H)<-[:HAS_SYNONYM]-(T)
                    WHERE (H:Synonym)
                    WITH N, M, T
                    OPTIONAL MATCH (N)<-[:HAS_SYNONYM]-(MT)
                    WHERE (N:Synonym)
                    WITH N, M, T, MT
                    WHERE (EXISTS(N.id) OR EXISTS(MT.id)) AND EXISTS(T.id) AND T.gwas_total > 0
                    RETURN DISTINCT COALESCE(N.id, MT.id) as mouseID, COALESCE(MT.FSN, N.FSN) as mouseLabel, COALESCE(N.experiment_total, MT.experiment_total) AS Experiments, N.ontology as mouseOnt, M.is_exact_match as isExactMatch, T.id as humanID, T.gwas_total AS GWAS, T.FSN as humanLabel, T.ontology as humanOnt
                        ",
                        ["search"=>$search, "searchContains"=>" " . $search]);
                }

            $matches = [];
            foreach ($result as $row) {
                $gwas = $row->get("GWAS");
                $experiments = $row->get("Experiments");
                if (!$gwas)
                    $gwas = 0;
                if (!$experiments)
                    $experiments = 0;
                $parsed = ["mouseID"=> $row->get("mouseID"), "mouseSynonyms"=>$this->get_term_synonyms($row->get("mouseID"), $row->get("mouseOnt")), "mouseLabel"=> $row->get("mouseLabel"), "experiments"=>$experiments, "mouseOnt"=> $row->get("mouseOnt"), "isExactMatch"=> $row->get("isExactMatch"), "gwas"=>$gwas, "humanID"=> $row->get("humanID"), "humanSynonyms"=>$this->get_term_synonyms($row->get("humanID"), $row->get("humanOnt")),"humanLabel"=> $row->get("humanLabel"), "humanOnt"=> $row->get("humanOnt")];
                array_push($matches, $parsed);
            }
            return $matches;
        }



        public function get_term_synonyms($termID, $ontology) {
            if (!$ontology)
                return null;
            $result = $this->neo->execute("MATCH (N:" . $ontology . ")-[r:HAS_SYNONYM]-(S) WHERE N.id = {termID} RETURN ID(S) AS SynonymID, S.FSN AS Synonym;", ["termID"=>$termID]);
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

        public function get_term_descendants($termID, $ontology) {
            $ontology = strtoupper($ontology);
            $result = $this->neo->execute("MATCH (n:$ontology)<-[:ISA*1..]-(m)
            WHERE n.id = {termID} AND m.isObsolete = 'false' AND m:Term
            RETURN m.id AS descendant", ["termID"=>$termID]);
            $descendants = [];
            foreach ($result as $row) {
                array_push($descendants, $row->get("descendant"));
            }
            return $descendants;
        }

        public function get_root_ontology_trees($ontology) {
            $ontLabel = strtoupper($ontology) == "MESH" ? "MESH" : "HP";
            $result = ["mouseTree" => [], "humanTree" => [], "mouseID" => "", "humanID" => "", "isExactMatch" => False];
            $mouseOntTree = new OntologyTree("MP", "MP", null, true, $ontLabel);
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
                    $tree = new OntologyTree($humanOntology, $humanOntLabel, $humanID, false, $mouseOntology);
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
            RETURN n.id AS parentID, n.FSN AS parentLabel, m.id AS id, m.FSN AS label, m.$mappingProperty AS hasMapping, m.hasChildren AS hasChildren, m.gwas_total AS gwas_total, m.experiment_total AS experiment_total
            ORDER BY label ASC", ["termID"=>$termID]);

            $return_package = [];
            foreach ($children as $child) {
                $hasMapping = false;
                if ($child->hasValue("hasMapping"))
                    $hasMapping = $child->get('hasMapping');
                $hasData = $child->get("gwas_total") > 0 || $child->get("experiment_total") > 0 ? true : false;
                $childNode = new TreeNode($child->get('id'), $child->get('label'), $hasMapping, $child->get('hasChildren'), $hasData);
                $return_package[$child->get('id')] = $childNode;
            }
            return $return_package;
        }

    }

?>