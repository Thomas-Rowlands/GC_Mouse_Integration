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

        public function term_search($search, $ont) {
            $result = $this->neo->execute("
            MATCH (syn)<-[:HAS_SYNONYM*0..1]-(ontTerm)
                WHERE ontTerm.ontology in [" . (strtolower($ont) == "mp" ? "'mp'" : "'mesh', 'hpo'") . "] AND (toLOWER(syn.FSN) STARTS WITH {search} OR toLOWER(syn.FSN) CONTAINS {searchContains} OR toLOWER(ontTerm.FSN) STARTS WITH {search} OR toLOWER(ontTerm.FSN) CONTAINS {searchContains}) AND ontTerm.id IS NOT NULL
            RETURN ontTerm.id AS id, ontTerm.ontology AS ontology, ontTerm.FSN AS FSN, ontTerm.hasMPMapping AS hasMPMapping, ontTerm.hasMESHMapping AS hasMESHMapping, ontTerm.hasHPOMapping AS hasHPOMapping, ontTerm.gwas_total AS gwas_total, ontTerm.experiment_total AS experiment_total LIMIT 10;
            ", ["search"=>$search, "searchContains"=>" " . $search]);
            $matches = [];
            foreach ($result as $row) {
                $termID = $row->get("id");
                $termOnt = $row->get("ontology");
                $label = $row->get("FSN");
                $parsed = ["id"=> $termID, "synonyms"=>$this->get_term_synonyms($termID, $termOnt), "label"=> $label, "experiments"=>$row->get("experiment_total"), "ont"=> $termOnt, "gwas"=>$row->get("gwas_total")];
                if (strtolower($label) == $search)
                    array_unshift($matches, $parsed);
                else
                    array_push($matches, $parsed);
            }
            return $matches;
        }

        public function term_search_limited($search, $ont) {
            $result = $this->neo->execute("
            MATCH (syn)<-[:HAS_SYNONYM*0..1]-(ontTerm)
                WHERE ontTerm.ontology = {ontology} AND (toLOWER(syn.FSN) STARTS WITH {search} OR toLOWER(syn.FSN) CONTAINS {searchContains} OR toLOWER(ontTerm.FSN) STARTS WITH {search} OR toLOWER(ontTerm.FSN) CONTAINS {searchContains}) AND ontTerm.id IS NOT NULL
            RETURN ontTerm.id AS id, ontTerm.ontology AS ontology, ontTerm.FSN AS FSN, ontTerm.hasMPMapping AS hasMPMapping, ontTerm.hasMESHMapping AS hasMESHMapping, ontTerm.hasHPOMapping AS hasHPOMapping, ontTerm.gwas_total AS gwas_total, ontTerm.experiment_total AS experiment_total LIMIT 10;
            ", ["search"=>$search, "searchContains"=>" " . $search, "ontology"=>strtolower($ont)]);
            $matches = [];
            foreach ($result as $row) {
                $termID = $row->get("id");
                $termOnt = $row->get("ontology");
                $label = $row->get("FSN");
                $parsed = ["id"=> $termID, "synonyms"=>$this->get_term_synonyms($termID, $termOnt), "label"=> $label, "experiments"=>$row->get("experiment_total"), "ont"=> $termOnt, "gwas"=>$row->get("gwas_total")];
                if (strtolower($label) == $search)
                    array_unshift($matches, $parsed);
                else
                    array_push($matches, $parsed);
            }
            return $matches;
        }


        public function search_mouse_term($search, $mappingOnt, $is_open_search=false, $human_pval=0, $mouse_pval=0, $isLimited=false) {
            $result = null;
            $ont = strtoupper($mappingOnt);
            $search = strtolower($search);
            $matches = [];
            if (!$isLimited)
                $matches = $this->term_search($search, "MP");
            else
                $matches = $this->term_search_limited($search, "MP");
            if (!$matches)
                return [];
            for ($i = 0; $i < sizeof($matches); $i++) {
                $mapping = $this->get_human_mapping_by_id($matches[$i]["id"], $mappingOnt);
                $matches[$i]["mappedID"] = null;
                $matches[$i]["mappedLabel"] = null;
                $matches[$i]["mappedSynonyms"] = null;
                $matches[$i]["mappedOnt"] = null;
                if ($mapping) {
                    $matches[$i]["mappedID"] = $mapping["mappedID"];
                    $matches[$i]["mappedLabel"] = $mapping["mappedLabel"];
                    $matches[$i]["mappedSynonyms"] = $mapping["mappedSynonyms"];
                    $matches[$i]["mappedOnt"] = $mapping["mappedOnt"];
                }
                    
            }
            return $matches;
        }

        public function search_human_term($search, $ontology, $is_open_search=false, $human_pval=0, $mouse_pval=0, $isLimited=false) {
            $result = null;
            $search = strtolower($search);
            $matches = [];
            if (!$isLimited)
                $matches = $this->term_search($search, $ontology);
            else
                $matches = $this->term_search_limited($search, $ontology);
            if (!$matches)
                return [];

            for ($i = 0; $i < sizeof($matches); $i++) {
                $mapping = $this->get_mp_mapping_by_id($matches[$i]["id"]);
                $matches[$i]["mappedID"] = null;
                $matches[$i]["mappedLabel"] = null;
                $matches[$i]["mappedSynonyms"] = null;
                $matches[$i]["mappedOnt"] = null;
                if ($mapping) {
                    $matches[$i]["mappedID"] = $mapping["mappedID"];
                    $matches[$i]["mappedLabel"] = $mapping["mappedLabel"];
                    $matches[$i]["mappedSynonyms"] = $mapping["mappedSynonyms"];
                    $matches[$i]["mappedOnt"] = $mapping["mappedOnt"];
                }

                    
            }
            return $matches;
        }

        public function get_mp_mapping_by_id($termID) {
            $result = $this->neo->execute("
            MATCH (n {id: '".$termID."'})
            WITH n
            OPTIONAL MATCH (n)-[:HAS_SYNONYM]->(syns)
            WITH n, COLLECT(syns) AS syns
            MATCH p=(o)-[r:LOOM_MAPPING]->(mappedSyn:MP)<-[:HAS_SYNONYM*0..1]-(mappedTerm:MP)
            WHERE (o in syns or o = n) AND mappedTerm:Term
            RETURN DISTINCT COALESCE(mappedTerm.id, mappedSyn.id) AS mappedID, COALESCE(mappedTerm.FSN, mappedSyn.FSN) AS mappedLabel", []);
            $mappings = [];
            if ($result)
                foreach ($result as $row) {
                    $record = ["mappedID" => $row->get("mappedID"), "mappedOnt"=>"MP", "mappedLabel" => $row->get("mappedLabel"), "mappedSynonyms"=> $this->get_term_synonyms($row->get("mappedID"), "MP")];
                    array_push($mappings, $record);
                }
            return $mappings;
        }

        public function get_human_mapping_by_id($termID, $targetOnt) {
            $result = $this->neo->execute("
            MATCH (n {id: '".$termID."'})
            WITH n
            OPTIONAL MATCH (n)-[:HAS_SYNONYM]->(syns)
            WITH n, COLLECT(syns) AS syns
            MATCH p=(o)-[r:LOOM_MAPPING]->(mappedSyn)<-[:HAS_SYNONYM*0..1]-(mappedTerm)
            WHERE (o in syns or o = n) AND mappedSyn.ontology = '".strtolower($targetOnt)."' AND mappedTerm.ontology = '".strtolower($targetOnt)."' AND mappedTerm:Term
            RETURN DISTINCT COALESCE(mappedTerm.id, mappedSyn.id) AS mappedID, COALESCE(mappedTerm.FSN, mappedSyn.FSN) AS mappedLabel, COALESCE(mappedTerm.ontology, mappedSyn.ontology) AS mappedOntology", []);
            $mappings = [];
            if ($result)
                foreach ($result as $row) {
                    $record = ["mappedID" => $row->get("mappedID"), "mappedOnt"=>$row->get("mappedOnt"),"mappedLabel" => $row->get("mappedLabel"), "mappedSynonyms" => $this->get_term_synonyms($row->get("mappedID"), $targetOnt)];
                    array_push($mappings, $record);
                }
            return $mappings;
        }

        public function get_term_synonyms($termID, $ontology) {
            if (!$ontology)
                return null;
            $result = $this->neo->execute("MATCH (N:" . strtoupper($ontology) . ")-[r:HAS_SYNONYM]->(S) WHERE N.id = {termID} RETURN ID(S) AS SynonymID, S.FSN AS Synonym;", ["termID"=>$termID]);
            $synonyms = [];
            foreach ($result as $row) {
                array_push($synonyms, $row->get("Synonym"));
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
            WHERE n.id = {termID} AND m.isObsolete = 'false'
            RETURN DISTINCT m.id AS descendant", ["termID"=>$termID]);
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
            $humanOntology = $humanOntology;
            $mouseOntology = $mouseOntology;
            $searchOntology = $searchOntology;
            $humanOntLabel = $humanOntology == "MESH" ? "MESH" : "HP";
            $mouseID = "";
            $humanID = "";
            $mouseLabel = "";
            $humanLabel = "";
            $match = null;
            if ($searchOntology == "MP") {
                $match = $this->search_mouse_term($term, $humanOntology, false, 0, 0, true);
            } else {
                $match = $this->search_human_term($term, $searchOntology, false, 0, 0, true);
            }
            if ($match) {
                $isExactMatch = null;

                if ($searchOntology == "MP") {
                    $mouseID = $match[0]["id"];
                    $mouseLabel = $match[0]["label"];
                    if (key_exists("mappedID", $match[0])) {
                        $humanID = $match[0]["mappedID"];
                        $humanLabel = $match[0]["mappedLabel"];
                    }
                } else {
                    $humanID = $match[0]["id"];
                    $humanLabel = $match[0]["label"];
                    if (key_exists("mappedID", $match[0])) {
                        $mouseID = $match[0]["mappedID"];
                        $mouseLabel = $match[0]["mappedLabel"];
                    }
                }
                
                $result = ["mouseTree" => [], "humanTree" => [], "mouseID" => "", "mouseLabel" => "", "humanID" => "", "humanLabel" => ""];

                if ($mouseID) {
                    $tree = new OntologyTree($mouseOntology, $mouseOntology, $mouseID, false, $humanOntology);
                    $result["mouseTree"] = $tree->getTree();
                } 

                if ($humanID) {
                    $tree = new OntologyTree($humanOntology, $humanOntLabel, $humanID, false, $mouseOntology);
                    $result["humanTree"] = $tree->getTree();
                }
                if (!$humanID && !$mouseID)
                    return null;


                $result["mouseID"] = $mouseID;
                $result["mouseLabel"] = $mouseLabel;
                $result["humanID"] = $humanID;
                $result["humanLabel"] = $humanLabel;

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
