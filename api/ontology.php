<?php
    include_once 'database.php';
    include_once 'utility.php';

    class Ontology {

        public function __construct(){
            $this->con = new GC_Connection("gc_mouse");
            $this->neo = new Neo_Connection();
        }

        public function search_mouse_term($search) {
            $result = $this->neo->execute("MATCH (N:MP)-[r:LOOM_MAPPING]->(H) WHERE N.FSN =~ '(?i).*{$search}.*' RETURN N.FSN AS Mouse_Label, N.id as Mouse_ID, H.FSN AS Human_Label, H.id AS Human_ID");
            $matches = [];
            foreach ($result as $row) {
                $parsed = ["Mouse_ID"=>$row->value("Mouse_ID"), "Mouse_Label"=>$row->value("Mouse_Label"), "Human_ID"=>$row->value("Human_ID"), "Human_Label"=>$row->value("Human_Label")];
                array_push($matches, $parsed);
            }
            return $matches;
        }

        public function search_human_term($search) {
            $result = $this->neo->execute("MATCH (N)-[r:LOOM_MAPPING]->(H) WHERE (H:HPO OR H:MESH) AND N:MP AND H.FSN =~ '(?i).*{$search}.*' RETURN H.FSN AS Human_Label, H.id as Human_ID, N.FSN AS Mouse_Label, N.id AS Mouse_ID");
            $matches = [];
            foreach ($result as $row) {
                $parsed = ["Mouse_ID"=>$row->value("Mouse_ID"), "Mouse_Label"=>$row->value("Mouse_Label"), "Human_ID"=>$row->value("Human_ID"), "Human_Label"=>$row->value("Human_Label")];
                array_push($matches, $parsed);
            }
            return $matches;
        }

        public function get_ontology_mappings($termID) {
            $result = $this->neo->execute("MATCH (N)-[M:LOOM_MAPPING]->(H) WHERE N.id = \"{$termID}\" RETURN N.id as sourceID, N.FSN as sourceLabel, N.ontology as sourceOnt, M.is_exact_match as isExactMatch, H.id as mappedID, H.FSN as mappedLabel, H.ontology as mappedOnt");
            $mappings = [];
            foreach ($result as $row) {
                $parsed = ["sourceID"=> $row->value("sourceID"), "sourceSynonyms"=>$this->get_term_synonyms($row->value("sourceID"), $row->value("sourceOnt")), "sourceLabel"=> $row->value("sourceLabel"), "sourceOnt"=> $row->value("sourceOnt"), "isExactMatch"=> $row->value("isExactMatch"), "mappedID"=> $row->value("mappedID"), "mappedSynonyms"=>$this->get_term_synonyms($row->value("mappedID"), $row->value("mappedOnt")),"mappedLabel"=> $row->value("mappedLabel"), "mappedOnt"=> $row->value("mappedOnt")];
                array_push($mappings, $parsed);
            }
            return $mappings;
        }

        public function get_term_synonyms($termID, $ontology) {
            $ontology = strtoupper($ontology);
            $result = $this->neo->execute("MATCH (N:{$ontology})-[r:HAS_SYNONYM]-(S) WHERE N.id = \"{$termID}\" RETURN S.FSN AS Synonym;");
            $synonyms = [];
            foreach ($result as $row) {
                array_push($synonyms, $row->value("Synonym"));
            }
            return $synonyms;
        }

        public function get_ontology_hierarchy($termID, $ontology) {
            $ontology = strtoupper($ontology);
            $result = null;
            if ($ontology == "MP")
                $result = $this->neo->execute("MATCH p = (child:MP {id:\"{$termID}\"})-[:ISA *0..]->(parent)-[:ISA]->(grandparent) OPTIONAL MATCH (parent)-[:HAS_SYNONYM]->(psynonyms) OPTIONAL MATCH (grandparent)-[:HAS_SYNONYM]->(gsynonyms) RETURN parent.id AS parentID, parent.FSN AS parentLabel, collect(DISTINCT(psynonyms.FSN)) AS parentSynonyms, grandparent.id AS gparentID, grandparent.FSN AS gparentLabel, collect(DISTINCT(gsynonyms.FSN)) AS gparentSynonyms;");
            else
                $result = $this->neo->execute("MATCH p = (child {id:\"{$termID}\"})-[:ISA *0..]->(parent)-[:ISA]->(grandparent) WHERE child:HPO or child:MESH OPTIONAL MATCH (parent)-[:HAS_SYNONYM]->(psynonyms) OPTIONAL MATCH (grandparent)-[:HAS_SYNONYM]->(gsynonyms) RETURN parent.id AS parentID, parent.FSN AS parentLabel, collect(DISTINCT(psynonyms.FSN)) AS parentSynonyms, grandparent.id AS gparentID, grandparent.FSN AS gparentLabel, collect(DISTINCT(gsynonyms.FSN)) AS gparentSynonyms");
            
            $return_package = [];
            for (end($result); key($result) !== null; prev($result)) {
                $row = current($result);
                $id = $row->value("parentID");
                $label = $row->value("parentLabel");
                $syns = $row->value("parentSynonyms");
                $parentID = $row->value("gparentID");
                $parentLabel = $row->value("gparentLabel");
                $parentSyns = $row->value("gparentSynonyms");

                //if this is a new term, insert it otherwise add the new parent record to it.
                if (!array_key_exists($id, $return_package)) {
                    $return_package[$id] = array("label"=>$label, "syns"=>$syns, "parents"=>array($parentID));
                } else {
                    array_push($return_package[$id]["parents"], $parentID);
                }

            }
            return $return_package;
        }

    }

?>