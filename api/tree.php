<?php
        include_once 'database.php';
        include_once 'utility.php';

    class OntologyTree {

        private $nodeIDs;
        private $tree;
        private $neo;
        private $ontLabel;

        public function __construct($ontLabel){
            $this->ontLabel = $ontLabel;
            $this->neo = new Neo_Connection();
        }


        public function getRootTree($ontLabel) {

        }

        private function getTermChildren($termID) {
            $result = $this->neo->execute("MATCH (n:$this->ontLabel {id: \"$termID\"})<-[:ISA]-(m)
            RETURN m.id AS id, m.FSN AS label
            ORDER BY label ASC");
            return $result;
        }

        private function getTermSiblings($termID) {
            $result = $this->neo->execute("MATCH (n:$this->ontLabel {id: \"$termID\"})-[:hasSibling]->(sib)
            RETURN sib.id AS id, sib.FSN AS label 
            ORDER BY label ASC");
            return $result;
        }

        private function getTreeByID($id) {
            $cmd = "MATCH p=(startNode:$this->ontLabel{id: '$this->ontLabel:0000001'})<-[:ISA*1..]-(endNode:$this->ontLabel{id: \"$id\"})
            RETURN p";
            $result = $this->neo->execute($cmd);
            if ($result) {
                $root = $result[0]->get("p")->start();
                $tree = new TreeNode($root->value('id'), $root->value('FSN')); // Set the root node to begin tree building.
                foreach ($result as $row) { // Iterate through paths returned (could be multiple to the same node)
                    $path = $row->get("p");
                    $nodes = $path->nodes();
                    $parentTreeNode = $tree; //start at root
                    for ($i = 0; $i < count($nodes); $i++) {
                        if ($i == 0)//first node will be the root which is already added.
                            continue;
                        if (!array_key_exists($nodes[$i]->value('id'), $parentTreeNode->children)) {
                            $childNode = new TreeNode($nodes[$i]->value('id'), $nodes[$i]->value('FSN'));
                            $sibs = $this->getTermSiblings($childNode->id);

                            $parentTreeNode->children[$nodes[$i]->value('id')] = $childNode;
                            foreach ($sibs as $sib) {
                                if (!array_key_exists($sib->get('id'), $parentTreeNode->children)) {
                                    $sibNode = new TreeNode($sib->get('id'), $sib->get('label'));
                                    $parentTreeNode->children[$sib->get('id')] = $sibNode;
                                }
                            }
                        }
                        $parentTreeNode = $parentTreeNode->children[$nodes[$i]->value('id')];                        
                    }

                }
            }
        }

        public function getTerms() {

        }

        public function getTerm($id) {

        }


    }

    class TreeNode {

        public $id;
        public $label;
        public $children = [];

        public function __construct($id, $label) {
            $this->id = $id;
            $this->label = $label;
        }


    }



?>