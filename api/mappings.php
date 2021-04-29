<?php

    class Mapper {
        public static function getMappings($mouseID, $humanID, $ontology, $neo) {
            $result = null;
            if ($ontology == "HPO") {
                // $result = $this->neo->execute("MATCH (N)-[M:LOOM_MAPPING]->(H) WHERE N.id = \"{$termID}\" RETURN N.id as mouseID, N.FSN as mouseLabel, N.ontology as mouseOnt, M.is_exact_match as isExactMatch, M.is_synonym_match as isSynonymMatch, H.id as humanID, H.FSN as humanLabel, H.ontology as humanOnt");
                $result = $neo->execute("MATCH (mouseTerm:MP{id:\"$mouseID\"})-[:HAS_SYNONYM*0..]->(mouseSyn)
                WITH mouseTerm, COLLECT(mouseSyn) AS mouseSyns
            MATCH (humanTerm:HPO{id: \"$humanID\"})-[:HAS_SYNONYM*0..]->(humanSyn)
                WITH mouseTerm, mouseSyns, humanTerm, COLLECT(humanSyn) AS humanSyns
            MATCH (N)-[M:LOOM_MAPPING]-(H)
                WHERE (N in mouseSyns or N = mouseTerm) AND (H in humanSyns or H = humanTerm)
            RETURN DISTINCT ID(mouseTerm) AS mouseTermNodeId, mouseTerm.id as mouseID, mouseTerm.FSN AS mouseTermLabel, ID(N) as mouseNodeId, N.originalType as mouseType, N.FSN as mouseLabel, N.ontology as mouseOnt, M.is_exact_match as isExactMatch, ID(humanTerm) AS humanTermNodeId, humanTerm.FSN AS humanTermLabel, humanTerm.id as humanID, H.FSN as humanLabel, H.ontology as humanOnt, ID(H) as humanNodeId, H.originalType as humanType");
            } else {
                $result = $neo->execute("MATCH (mouseTerm:MP{id:\"$mouseID\"})-[:HAS_SYNONYM*0..]->(mouseSyn)
                WITH mouseTerm, COLLECT(mouseSyn) AS mouseSyns
                MATCH (N)-[M:LOOM_MAPPING]->(H:MESH)
                WHERE N = mouseTerm or N in mouseSyns
                WITH N, M, H, mouseTerm
                OPTIONAL MATCH (H)<-[:HAS_SYNONYM|:HAS_CONCEPT *1..2]-(humanTerm {originalType: \"descriptor\"})
                WITH N, M, H, humanTerm, mouseTerm
                RETURN ID(mouseTerm) AS mouseTermNodeId, mouseTerm.FSN AS mouseTermLabel, mouseTerm.id as mouseID, ID(N) as mouseNodeId,  N.originalType as mouseType, N.FSN as mouseLabel, N.ontology as mouseOnt, M.is_exact_match as isExactMatch, COALESCE(ID(humanTerm), ID(H)) AS humanTermNodeId, COALESCE(humanTerm.FSN, H.FSN) AS humanTermLabel, COALESCE(H.id, humanTerm.id) as humanID, H.FSN as humanLabel, H.ontology as humanOnt, ID(H) as humanNodeId, H.originalType as humanType");
            }
            $mappings = [];
            $term_mapping_retrieved = false;
            foreach ($result as $row) {
                if (!$term_mapping_retrieved) {
                    $mappings = ["mouseNodeId"=> $row->get("mouseTermNodeId"), "mouseID"=> $mouseID, "mouseSynonyms"=>Mapper::get_term_synonyms($row->get("mouseID"), $row->get("mouseOnt"), $neo), "mouseLabel"=> $row->get("mouseTermLabel"), "mouseOnt"=> $row->get("mouseOnt"), "isExactMatch"=> $row->get("isExactMatch"), "humanNodeId"=> $row->get("humanTermNodeId"), "humanID"=> $humanID, "humanSynonyms"=>Mapper::get_term_synonyms($row->get("humanID"), $row->get("humanOnt"), $neo),"humanLabel"=> $row->get("humanTermLabel"), "humanOnt"=> $row->get("humanOnt"), "matches" => []];
                    $term_mapping_retrieved = true;
                }
                $match = ["mouseNodeId" => $row->get("mouseNodeId"), "mouseNodeType" => $row->get("mouseType"), "mouseLabel" => $row->get("mouseLabel"), "isExact" => $row->get("isExactMatch"), "humanNodeId" => $row->get("humanNodeId"), "humanNodeType" => $row->get("humanType"), "humanLabel" => $row->get("humanLabel")];
                array_push($mappings["matches"], $match);
            }
            return $mappings;
        }

        public static function getHPOMappings($mouseID, $humanID, $neo) {
            $result = $neo->execute("MATCH (humanTerm:HPO{id:\"$termID\"})-[:HAS_SYNONYM*0..]->(humanSyn)
            WITH humanTerm, COLLECT(humanSyn) AS humanSyns
            MATCH (N:MP)-[M:LOOM_MAPPING]->(H)
            WHERE H = humanTerm or H in humanSyns
            WITH N, M, H, humanTerm
            OPTIONAL MATCH (N)<-[:HAS_SYNONYM]-(mouseTerm)
            WITH N, M, H, mouseTerm, humanTerm
            RETURN ID(N) as mouseNodeId, mouseTerm.id as mouseID, N.originalType as mouseType, N.FSN as mouseLabel, N.ontology as mouseOnt, M.is_exact_match as isExactMatch, COALESCE(H.id, humanTerm.id) as humanID, H.FSN as humanLabel, H.ontology as humanOnt, ID(H) as humanNodeId, H.originalType as humanType");
            $mappings = [];
            $mappings = ["mouseID"=> $row->get("mouseID"), "mouseSynonyms"=>$this->get_term_synonyms($row->get("mouseID"), $row->get("mouseOnt")), "mouseLabel"=> $row->get("mouseLabel"), "mouseOnt"=> $row->get("mouseOnt"), "isExactMatch"=> $row->get("isExactMatch"), "humanID"=> "", "humanSynonyms"=>$this->get_term_synonyms($row->get("humanID"), $row->get("humanOnt")),"humanLabel"=> $row->get("humanLabel"), "humanOnt"=> $row->get("humanOnt"), "matches" => []];
            foreach ($result as $row) {
                if ($row->get("humanID"))
                    $mappings["humanID"] = $row->get("humanID");
                $match = ["mouseNodeId" => $row->get("mouseNodeId"), "mouseNodeType" => $row->get("mouseType"), "mouseLabel" => $row->get("mouseLabel"), "isExact" => $row->get("isExactMatch"), "humanNodeId" => $row->get("humanNodeId"), "humanNodeType" => $row->get("humanType"), "humanLabel" => $row->get("humanLabel")];
                array_push($mappings["matches"], $match);
            }
            return $mappings;
        }

        public static function getMESHMappings($termID, $neo) {
            $result = $neo->execute("MATCH (humanTerm:MESH{id:\"$termID\"})-[:HAS_SYNONYM*0..]->(humanSyn)
            WITH humanTerm, COLLECT(humanSyn) AS humanSyns
            MATCH (N:MP)-[M:LOOM_MAPPING]->(H)
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

        public static function get_term_synonyms($termID, $ontology, $neo) {
            $ontology = strtoupper($ontology);
            $result = null;
            if ($ontology == "MESH") {
                $result = $neo->execute("MATCH (N:MESH)-[:HAS_CONCEPT]-(S)
                WHERE N.id = \"{$termID}\" 
                RETURN DISTINCT ID(S) AS SynonymID, S.FSN AS Synonym
                UNION ALL
                MATCH (N:MESH)-[:HAS_CONCEPT]-(M)-[:HAS_SYNONYM]-(S) 
                WHERE N.id = \"{$termID}\" 
                RETURN DISTINCT ID(S) AS SynonymID, S.FSN AS Synonym;");
            } else {
                $result = $neo->execute("MATCH (N:{$ontology})-[r:HAS_SYNONYM]-(S) WHERE N.id = \"{$termID}\" RETURN ID(S) AS SynonymID, S.FSN AS Synonym;");
            }
            
            $synonyms = [];
            foreach ($result as $row) {
                array_push($synonyms, ["synonymId" => $row->get("SynonymID"), "synonymLabel" => $row->get("Synonym")]);
            }
            return $synonyms;
        }

    }

?>