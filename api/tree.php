<?php
    include_once 'database.php';
    include_once 'utility.php';

    class OntologyTree {

        private $nodeIDs;
        private $tree;
        private $neo;
        private $ontLabel;
        private $mappingOntLabel;
        private $termIDLabel;

        public function __construct($ontLabel, $termIDLabel, $termID=null, $isRoot=false, $mappingOntLabel){
            $this->neo = new Neo_Connection();
            $this->ontLabel = $ontLabel;
            $this->termIDLabel = $termIDLabel;
            $this->mappingOntLabel = $mappingOntLabel;
            if ($termID) {
                $this->getTreeByID($termID, $ontLabel == "MESH");
            } else if ($isRoot) {
                $this->getRootTree($ontLabel == "MESH");
            }
        }

        public function getTree() {
            return $this->tree;
        }


        private function getRootTree($isMesh=false) {
            $results = null;
            if (!$isMesh) {
                $results = $this->getTermChildren("$this->termIDLabel:0000001");
            } else {
                $results = $this->getTermChildren("mesh", $isMesh);
            }
            $rootNode = new TreeNode($results[0]->get('parentID'), $results[0]->get('parentLabel'), false, true);
            foreach ($results as $result) {
                $childNode = new TreeNode($result->get('id'), $result->get('label'), $result->get('hasMapping'), $result->get('hasChildren'));
                $rootNode->children[$result->get('id')] = $childNode;
            }
            $this->tree = $rootNode;
        }

        private function getTermChildren($termID, $isMesh=false) {
            $mappingProperty = "";
            if ($this->ontLabel != "MP") {
                $mappingProperty = "hasMPMapping";
            } else {
                if ($this->mappingOntLabel == "MESH") {
                    $mappingProperty = "hasMESHMapping";
                } else {
                    $mappingProperty = "hasHPOMapping";
                }
            }
            $result = $this->neo->execute("MATCH (n:$this->ontLabel {id: \"$termID\"})<-[:ISA]-(m)
            RETURN n.id AS parentID, n.FSN AS parentLabel, m.id AS id, m.FSN AS label, m.$mappingProperty AS hasMapping, m.hasChildren AS hasChildren
            ORDER BY label ASC");
            return $result;
        }

        private function getTermSiblings($termID, $isMesh=false) {
            $mappingProperty = "has{$this->mappingOntLabel}Mapping";
            $result = $this->neo->execute("MATCH (n:$this->ontLabel {id: \"$termID\"})-[:hasSibling]->(sib)
            RETURN sib.id AS id, sib.FSN AS label, sib.$mappingProperty AS hasMapping, sib.hasChildren AS hasChildren
            ORDER BY label ASC");
            return $result;
        }

        private function getTreeByID($id, $isMesh=false) {
            $root = $this->ontLabel == "MESH" ? "mesh" : "{$this->termIDLabel}:0000001";
            $cmd = "MATCH p=(startNode:$this->ontLabel{id: \"$root\"})<-[:ISA*1..]-(endNode:$this->ontLabel{id: \"$id\"})
            RETURN p";
            $mappingProperty = "has" . $this->mappingOntLabel . "Mapping";
            $result = $this->neo->execute($cmd);
            if ($result) {
                $root = $result[0]->get("p")->start();
                $this->tree = new TreeNode($root->value('id'), $root->value('FSN'), null, true); // Set the root node to begin tree building.
                foreach ($result as $row) { // Iterate through paths returned (could be multiple to the same node)
                    $path = $row->get("p");
                    $nodes = $path->nodes();
                    $parentTreeNode = $this->tree; //start at root
                    for ($i = 0; $i < count($nodes); $i++) {
                        if ($i == 0)//first node will be the root which is already added.
                            continue;
                        if (!array_key_exists($nodes[$i]->value('id'), $parentTreeNode->children)) {
                            $hasMapping = false;
                            if ($nodes[$i]->hasValue($mappingProperty))
                                $hasMapping = true;
                            $childNode = new TreeNode($nodes[$i]->value('id'), $nodes[$i]->value('FSN'), $hasMapping, $nodes[$i]->hasValue('hasChildren'));
                            $sibs = $this->getTermSiblings($childNode->id, $isMesh);

                            $parentTreeNode->children[$nodes[$i]->value('id')] = $childNode;
                            foreach ($sibs as $sib) {
                                if (!array_key_exists($sib->get('id'), $parentTreeNode->children)) {
                                    $hasMapping = false;
                                    if ($sib->hasValue("hasMapping"))
                                        $hasMapping = $sib->get('hasMapping');
                                    $sibNode = new TreeNode($sib->get('id'), $sib->get('label'), $hasMapping, $sib->get('hasChildren'));
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

    class MeSHTree {
        private $tree;
        private $neo;

        public function __construct($termID=null, $isRoot=false){
            $this->neo = new Neo_Connection();
            if ($termID) {
                $this->getTreeByID($termID);
            } else if ($isRoot) {
                $this->getRootTree();
            }
        }

        public function getTree() {
            return $this->tree;
        }


        private function getRootTree() {
            $results = $this->getTermChildren("mesh");
            $rootNode = new TreeNode($results[0]->get('parentID'), $results[0]->get('parentLabel'), false, true);
            foreach ($results as $result) {
                $childNode = new TreeNode($result->get('id'), $result->get('label'), $result->get('hasMapping'), $result->get('hasChildren'));
                $rootNode->children[$result->get('id')] = $childNode;
            }
            $this->tree = $rootNode;
        }

        private function getTermChildren($termID) {
            $result = $this->neo->execute("MATCH (n:MESH {id: \"$termID\"})<-[:ISA]-(m)
            RETURN n.id AS parentID, n.FSN AS parentLabel, m.id AS id, m.FSN AS label, m.hasMPMapping AS hasMapping, m.hasChildren AS hasChildren
            ORDER BY label ASC");
            return $result;
        }

        private function getTermSiblings($termID) {
            $result = $this->neo->execute("MATCH (n:MESH {id: \"$termID\"})-[:hasSibling]->(sib)
            RETURN sib.id AS id, sib.FSN AS label, sib.hasMPMapping AS hasMapping, sib.hasChildren AS hasChildren
            ORDER BY label ASC");
            return $result;
        }

        private function getTreeByID($id) {
            $cmd = "MATCH p=(startNode:MESH{id: 'mesh'})<-[:ISA*1..]-(endNode:MESH{id: \"$id\"})
            RETURN p";
            $result = $this->neo->execute($cmd);
            if ($result) {
                $root = $result[0]->get("p")->start();
                $this->tree = new TreeNode($root->value('id'), $root->value('FSN'), null, true); // Set the root node to begin tree building.
                foreach ($result as $row) { // Iterate through paths returned (could be multiple to the same node)
                    $path = $row->get("p");
                    $nodes = $path->nodes();
                    $parentTreeNode = $this->tree; //start at root
                    for ($i = 0; $i < count($nodes); $i++) {
                        if ($i == 0)//first node will be the root which is already added.
                            continue;
                        if (!array_key_exists($nodes[$i]->value('id'), $parentTreeNode->children)) {
                            $hasMapping = false;
                            if ($nodes[$i]->hasValue("hasMPMapping") || $nodes[$i]->hasValue("hasHPOMapping"))
                                $hasMapping = true;
                            $childNode = new TreeNode($nodes[$i]->value('id'), $nodes[$i]->value('FSN'), $hasMapping, $nodes[$i]->hasValue('hasChildren'));
                            $sibs = $this->getTermSiblings($childNode->id);

                            $parentTreeNode->children[$nodes[$i]->value('id')] = $childNode;
                            foreach ($sibs as $sib) {
                                if (!array_key_exists($sib->get('id'), $parentTreeNode->children)) {
                                    $hasMapping = false;
                                    if ($sib->hasValue("hasMapping"))
                                        $hasMapping = $sib->get('hasMapping');
                                    $sibNode = new TreeNode($sib->get('id'), $sib->get('label'), $hasMapping, $sib->get('hasChildren'));
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
        public $hasMapping = false;

        public function __construct($id, $label, $hasMapping, $hasChildren) {
            $this->id = $id;
            $this->label = $label;
            $this->hasMapping = $hasMapping ? true : false;
            $this->hasChildren = $hasChildren ? true : false;
        }


    }



?>