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
            RETURN ontTerm.id AS id, ontTerm.ontology AS ontology, ontTerm.FSN AS FSN, ontTerm.hasMPMapping AS hasMPMapping, ontTerm.hasMESHMapping AS hasMESHMapping, ontTerm.hasHPOMapping AS hasHPOMapping, ontTerm.gwas_total AS gwas_total, ontTerm.experiment_total AS experiment_total
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


        public function search_mouse_term($search, $mappingOnt, $is_open_search=false, $human_pval=0, $mouse_pval=0) {
            $result = null;
            $ont = strtoupper($mappingOnt);
            $search = strtolower($search);
            $matches = $this->term_search($search, "MP");
            if (!$matches)
                return [];
            for ($i = 0; $i < sizeof($matches); $i++) {
                $mapping = $this->get_mp_mapping_by_id($matches[$i]["id"]);
                if ($mapping) {
                    $matches[$i]["mappedID"] = $mapping["mappedID"];
                    $matches[$i]["mappedLabel"] = $mapping["mappedLabel"];
                    $matches[$i]["isExactMatch"] = $mapping["isExactMatch"];
                }
                    
            }
            return $matches;
        }

        public function search_human_term($search, $ontology, $is_open_search=false, $human_pval=0, $mouse_pval=0) {
            $result = null;
            $ont = strtoupper($ontology);
            $search = strtolower($search);
                    $result = $this->neo->execute("MATCH (humanSyn)<-[:HAS_SYNONYM*0..1]-(humanTerm)-[:hasGWASResult]->(R:Result)<-[:containsGWASResult]-(S:Study)
    WHERE (humanSyn:MESH OR humanSyn:HPO OR humanTerm:MESH OR humanTerm:HPO) AND (toLOWER(humanSyn.FSN) STARTS WITH {search} OR toLOWER(humanSyn.FSN) CONTAINS {searchContains} OR toLOWER(humanTerm.FSN) STARTS WITH {search} OR toLOWER(humanTerm.FSN) CONTAINS {searchContains}) AND R.value >= {humanPval}
WITH humanTerm, S
OPTIONAL MATCH p=(E)-[:containsExperimentResult]->(P:Result)<-[:hasExperimentResult]-(mouseTerm:MP)-[:HAS_SYNONYM*0..1]->(mouseSyn:MP)-[M:LOOM_MAPPING]->(humanTerm)
                    WHERE P.value >= {mousePval}
WITH mouseTerm, humanTerm, E, M, S
RETURN DISTINCT mouseTerm.id AS mouseID, mouseTerm.FSN AS mouseLabel, mouseTerm.experiment_total AS Experiments, mouseTerm.ontology AS mouseOnt, M.is_exact_match AS isExactMatch, humanTerm.id AS humanID, humanTerm.FSN AS humanLabel, humanTerm.ontology AS humanOnt, humanTerm.gwas_total AS GWAS;",
                    ["search"=>$search, "searchContains"=>" " . $search, "humanPval"=>intval($human_pval), "mousePval"=>intval($mouse_pval)]);

            $matches = [];
            foreach ($result as $row) {
                $gwas = $row->get("GWAS");
                $experiments = $row->get("Experiments");
                if (!$gwas)
                    $gwas = 0;
                if (!$experiments)
                    $experiments = 0;
                $parsed = ["mouseID"=> $row->get("mouseID"), "mouseSynonyms"=>$this->get_term_synonyms($row->get("mouseID"), $row->get("mouseOnt")), "mouseLabel"=> $row->get("mouseLabel"), "experiments"=>$experiments, "mouseOnt"=> $row->get("mouseOnt"), "isExactMatch"=> $row->get("isExactMatch"), "gwas"=>$gwas, "humanID"=> $row->get("humanID"), "humanSynonyms"=>$this->get_term_synonyms($row->get("humanID"), $row->get("humanOnt")),"humanLabel"=> $row->get("humanLabel"), "humanOnt"=> $row->get("humanOnt")];
                if (strtolower($row->get("humanLabel")) == $search)
                    array_unshift($matches, $parsed);
                else
                    array_push($matches, $parsed);
            }
            return $matches;
        }

        public function get_mp_mapping_by_id($termID) {
            $result = $this->neo->execute("MATCH (N {id: '" . $termID . "'})-[r:LOOM_MAPPING]-(S:MP) RETURN DISTINCT S.id AS mappedID, S.FSN AS mappedLabel, r.is_exact_match AS isExactMatch;", []);
            $mappings = [];
            if ($result)
                foreach ($result as $row) {
                    $record = ["mappedID" => $row->get("mappedID"), "mappedLabel" => $row->get("mappedLabel"), "isExactMatch" => $row->get("isExactMatch")];
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
                $match = $this->search_mouse_term($term, $humanOntology);
            } else {
                $match = $this->search_human_term($term, $searchOntology);
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
                
                $result = ["mouseTree" => [], "humanTree" => [], "mouseID" => "", "mouseLabel" => "", "humanID" => "", "humanLabel" => "", "isExactMatch" => False];

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

                if ($mouseID && $humanID)
                    $isExactMatch = $match[0]["isExactMatch"];


                $result["mouseID"] = $mouseID;
                $result["mouseLabel"] = $mouseLabel;
                $result["humanID"] = $humanID;
                $result["humanLabel"] = $humanLabel;
                $result["isExactMatch"] = $isExactMatch;

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
