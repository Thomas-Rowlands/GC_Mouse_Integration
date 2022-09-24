<?php
    include_once 'database.php';
    include_once 'utility.php';
//    error_reporting(E_ALL);
//    ini_set('display_errors', '1');

    class OntologyTree {

        private $tree;
        private $neo;
        private $ontLabel;
        private $mappingOntLabel;
        private $termIDLabel;

        public function __construct($ontLabel, $termIDLabel, $termID, $isRoot, $mappingOntLabel){
            $this->neo = new Neo_Connection();
            $this->ontLabel = $ontLabel;
            $this->termIDLabel = $termIDLabel;
            $this->mappingOntLabel = $mappingOntLabel;
            if ($termID) {
                $this->getTreeByID($termID);
            } else if ($isRoot) {
                $this->getRootTree($ontLabel == "MESH");
            }
        }

        public function getTree() {
            return $this->tree;
        }


        private function getRootTree($isMesh=false) {
            if (!$isMesh) {
                $results = $this->getTermChildren("$this->termIDLabel:0000001");
            } else {
                $results = $this->getTermChildren("mesh");
            }
            $rootNode = new TreeNode($results[0]->get('parentID'), $results[0]->get('parentLabel'),
                false, false, true, false,
                false, false);
            $mappingProperty = "hasExact" . $this->mappingOntLabel . "Mapping";
            $inferredMappingProperty = "hasInferred" . $this->mappingOntLabel . "Mapping";
            foreach ($results as $result) {
                $hasData = $result->get("gwas_total") > 0 || $result->get("experiment_total") > 0;
                $hasHumanData = $result->value("hasHumanData");
                $hasMouseData = $result->value("hasMouseData");
                $childNode = new TreeNode($result->get('id'), $result->get('label'), $result->get($mappingProperty),
                    $result->get($inferredMappingProperty), $result->get('hasChildrenWithData'), $hasData,
                    $hasHumanData, $hasMouseData);
                $rootNode->children[$result->get('id')] = $childNode;
            }
            $this->tree = $rootNode;
        }

        private function getTermChildren($termID) {
            $mappingProperty = "hasExact" . $this->mappingOntLabel . "Mapping";
            $inferredMappingProperty = "hasInferred" . $this->mappingOntLabel . "Mapping";
            return $this->neo->execute("MATCH (n:$this->ontLabel {hasData: TRUE})<-[:ISA]-(m)
            USING INDEX n:$this->ontLabel(hasData)
            WHERE n.id = {termID}
            RETURN n.id AS parentID, n.FSN AS parentLabel, m.id AS id, m.FSN AS label, 
            m.$mappingProperty AS $mappingProperty, m.$inferredMappingProperty AS $inferredMappingProperty, 
            m.hasChildrenWithData AS hasChildrenWithData, m.gwas_total AS gwas_total, 
            m.experiment_total AS experiment_total, m.hasHumanData AS hasHumanData, m.hasMouseData AS hasMouseData
            ORDER BY label ASC", ["termID"=>$termID]);
        }

        private function getTermSiblings($termID) {
            $mappingProperty = "hasExact" . $this->mappingOntLabel . "Mapping";
            $inferredMappingProperty = "hasInferred" . $this->mappingOntLabel . "Mapping";
            return $this->neo->execute("MATCH (n:$this->ontLabel)-[:hasSibling]->(sib {hasData: TRUE})
            USING INDEX sib:$this->ontLabel(hasData)
            WHERE n.id = {termID}
            RETURN sib.id AS id, sib.FSN AS label, sib.$mappingProperty AS $mappingProperty, 
            sib.$inferredMappingProperty AS $inferredMappingProperty, sib.hasChildrenWithData AS hasChildrenWithData, 
            sib.gwas_total AS gwas_total, sib.experiment_total AS experiment_total, sib.hasHumanData AS hasHumanData,
            sib.hasMouseData AS hasMouseData
            ORDER BY label ASC", ["termID"=>$termID]);
        }

        private function getTreeByID($id) {
            $root = $this->ontLabel == "MESH" ? "mesh" : "$this->termIDLabel:0000001";
            $cmd = "MATCH p=(startNode:$this->ontLabel)<-[:ISA*1..]-(endNode:$this->ontLabel {hasData: TRUE})
            USING INDEX endNode:$this->ontLabel(hasData)
            WHERE startNode.id = {root} AND endNode.id = {termID} AND (endNode.hasHumanData = TRUE or endNode.hasMouseData = TRUE)
            RETURN p";
            $mappingProperty = "hasExact" . $this->mappingOntLabel . "Mapping";
            $inferredMappingProperty = "hasInferred" . $this->mappingOntLabel . "Mapping";
            $result = $this->neo->execute($cmd, ["root"=>$root, "termID"=>$id]);
            if ($result) {
                $root = $result[0]->get("p")->start();
                $this->tree = new TreeNode($root->value('id'), $root->value('FSN'), null,
                    null, true, false, false, false); // Set the root node to begin tree building.
                foreach ($result as $row) { // Iterate through paths returned (could be multiple to the same node)
                    $path = $row->get("p");
                    $nodes = $path->nodes();
                    $parentTreeNode = $this->tree; //start at root
                    for ($i = 0; $i < count($nodes); $i++) {
                        if ($i == 0)//first node will be the root which is already added.
                            continue;
                        if (!array_key_exists($nodes[$i]->value('id'), $parentTreeNode->children)) {
                            $hasExactMapping = $nodes[$i]->hasValue($mappingProperty) ? $nodes[$i]->get($mappingProperty) : false;
                            $hasInferredMapping = $nodes[$i]->hasValue($inferredMappingProperty) ? $nodes[$i]->get($inferredMappingProperty) : false;
                            $hasHumanData = $nodes[$i]->value("hasHumanData");
                            $hasMouseData = $nodes[$i]->value("hasMouseData");
                            $hasData = $hasHumanData || $hasMouseData;
                            $childNode = new TreeNode($nodes[$i]->value('id'), $nodes[$i]->value('FSN'),
                                $hasExactMapping, $hasInferredMapping, $nodes[$i]->value('hasChildrenWithData'),
                                $hasData, $hasHumanData, $hasMouseData);
                            $sibs = $this->getTermSiblings($childNode->id);

                            $parentTreeNode->children[$nodes[$i]->value('id')] = $childNode;
                            foreach ($sibs as $sib) {
                                if (!array_key_exists($sib->get('id'), $parentTreeNode->children)) {
                                    $hasExactMapping = $sib->hasValue($mappingProperty) ? $sib->get($mappingProperty) : false;
                                    $hasInferredMapping = $sib->hasValue($inferredMappingProperty) ? $sib->get($inferredMappingProperty) : false;
                                    $hasHumanData = $sib->value("hasHumanData");
                                    $hasMouseData = $sib->value("hasMouseData");
                                    $hasData = $hasHumanData || $hasMouseData;
                                    $sibNode = new TreeNode($sib->get('id'), $sib->get('label'), $hasExactMapping,
                                        $hasInferredMapping, $sib->get('hasChildrenWithData'), $hasData, $hasHumanData,
                                        $hasMouseData);
                                    $parentTreeNode->children[$sib->get('id')] = $sibNode;
                                }
                            }
                        }
                        $parentTreeNode = $parentTreeNode->children[$nodes[$i]->value('id')];                        
                    }
                }
            }
        }
    }

    class TreeNode {

        public $id;
        public $label;
        public $children = [];
        public $hasChildren = false;
        public $hasExactMapping = false;
        public $hasInferredMapping = false;
        public $hasData = false;
        public $hasHumanData = false;
        public $hasMouseData = false;

        public function __construct($id, $label, $hasExactMapping, $hasInferredMapping, $hasChildren, $hasData,
                                    $hasHumanData, $hasMouseData) {
            $this->id = $id;
            $this->label = $label;
            $this->hasExactMapping = $hasExactMapping;
            $this->hasInferredMapping = $hasInferredMapping;
            $this->hasChildren = $hasChildren;
            $this->hasData = $hasData;
            $this->hasHumanData = $hasHumanData;
            $this->hasMouseData = $hasMouseData;
        }


    }