<?php
    include_once 'database.php';
    include_once 'utility.php';
    error_reporting(E_ALL);
ini_set('display_errors', '1');

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
            $rootNode = new TreeNode($results[0]->get('parentID'), $results[0]->get('parentLabel'), false, true, false);
            foreach ($results as $result) {
                $hasData = $result->get("gwas_total") > 0 || $result->get("experiment_total") > 0;
                $childNode = new TreeNode($result->get('id'), $result->get('label'), $result->get('hasMapping'), $result->get('hasChildren'), $hasData);
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
            $result = $this->neo->execute("MATCH (n:$this->ontLabel)<-[:ISA]-(m)
            WHERE n.id = {termID}
            RETURN n.id AS parentID, n.FSN AS parentLabel, m.id AS id, m.FSN AS label, m.$mappingProperty AS hasMapping, m.hasChildren AS hasChildren, m.gwas_total AS gwas_total, m.experiment_total AS experiment_total
            ORDER BY label ASC", ["termID"=>$termID]);
            return $result;
        }

        private function getTermSiblings($termID) {
            $mappingProperty = "has{$this->mappingOntLabel}Mapping";
            $result = $this->neo->execute("MATCH (n:$this->ontLabel)-[:hasSibling]->(sib)
            WHERE n.id = {termID}
            RETURN sib.id AS id, sib.FSN AS label, sib.$mappingProperty AS hasMapping, sib.hasChildren AS hasChildren, sib.gwas_total AS gwas_total, sib.experiment_total AS experiment_total
            ORDER BY label ASC", ["termID"=>$termID]);
            return $result;
        }

        private function getTreeByID($id, $isMesh=false) {
            $root = $this->ontLabel == "MESH" ? "mesh" : "{$this->termIDLabel}:0000001";
            $cmd = "MATCH p=(startNode:$this->ontLabel)<-[:ISA*1..]-(endNode:$this->ontLabel)
            WHERE startNode.id = {root} AND endNode.id = {termID}
            RETURN p";
            $mappingProperty = "has" . $this->mappingOntLabel . "Mapping";
            $result = $this->neo->execute($cmd, ["root"=>$root, "termID"=>$id]);
            if ($result) {
                $root = $result[0]->get("p")->start();
                $this->tree = new TreeNode($root->value('id'), $root->value('FSN'), null, true, false); // Set the root node to begin tree building.
                foreach ($result as $row) { // Iterate through paths returned (could be multiple to the same node)
                    $path = $row->get("p");
                    $nodes = $path->nodes();
                    $parentTreeNode = $this->tree; //start at root
                    for ($i = 0; $i < count($nodes); $i++) {
                        if ($i == 0)//first node will be the root which is already added.
                            continue;
                        if (!array_key_exists($nodes[$i]->value('id'), $parentTreeNode->children)) {
                            $hasMapping = $nodes[$i]->hasValue($mappingProperty) ? $nodes[$i]->get($mappingProperty) : false;
                            $hasData = $nodes[$i]->value("gwas_total") > 0 || $nodes[$i]->value("experiment_total") > 0 ? true : false;

                            $childNode = new TreeNode($nodes[$i]->value('id'), $nodes[$i]->value('FSN'), $hasMapping, $nodes[$i]->hasValue('hasChildren'), $hasData);
                            $sibs = $this->getTermSiblings($childNode->id, $isMesh);

                            $parentTreeNode->children[$nodes[$i]->value('id')] = $childNode;
                            foreach ($sibs as $sib) {
                                if (!array_key_exists($sib->get('id'), $parentTreeNode->children)) {
                                    $hasMapping = $sib->hasValue($mappingProperty) ? $sib->get($mappingProperty) : false;
                                    $hasData = ($sib->value("gwas_total") > 0 || $sib->value("experiment_total") > 0) ? true : false;
                                    if ($sib->hasValue("hasMapping"))
                                        $hasMapping = $sib->get('hasMapping');
                                    $sibNode = new TreeNode($sib->get('id'), $sib->get('label'), $hasMapping, $sib->get('hasChildren'), $hasData);
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
        public $hasData = false;

        public function __construct($id, $label, $hasMapping, $hasChildren, $hasData) {
            $this->id = $id;
            $this->label = $label;
            $this->hasMapping = $hasMapping;
            $this->hasChildren = $hasChildren;
            $this->hasData = $hasData;
        }


    }



?>