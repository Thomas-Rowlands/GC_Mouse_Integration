<?php
    class Mapper {

        public static function getMappings($mouseID, $humanID, $ontology, $neo) {
            $result = $neo->execute("MATCH (mouseTerm:MP)-[:HAS_SYNONYM*0..]->(mouseSyn)
                WHERE mouseTerm.id = {mouseID}
                WITH mouseTerm, COLLECT(mouseSyn) AS mouseSyns
            MATCH (humanTerm:" . $ontology . ")-[:HAS_SYNONYM*0..]->(humanSyn)
                WHERE humanTerm.id = {humanID}
                WITH mouseTerm, mouseSyns, humanTerm, COLLECT(humanSyn) AS humanSyns
            MATCH (N)-[M:LOOM_MAPPING]-(H)
                WHERE (N in mouseSyns or N = mouseTerm) AND (H in humanSyns or H = humanTerm)
            RETURN DISTINCT ID(mouseTerm) AS mouseTermNodeId, mouseTerm.id as mouseID, mouseTerm.FSN AS mouseTermLabel, mouseTerm.experiment_total AS Experiments, ID(N) as mouseNodeId, N.originalType as mouseType, N.FSN as mouseLabel, N.ontology as mouseOnt, M.is_exact_match as isExactMatch, ID(humanTerm) AS humanTermNodeId, humanTerm.FSN AS humanTermLabel, humanTerm.id as humanID, H.FSN as humanLabel, H.gwas_total AS GWAS, H.ontology as humanOnt, ID(H) as humanNodeId, H.originalType as humanType",
        ["mouseID"=>$mouseID, "humanID"=>$humanID]);
            $mappings = [];
            $term_mapping_retrieved = false;
            $gwas = 0;
            $experiments = 0;
            foreach ($result as $row) {
                if (!$term_mapping_retrieved) {
                    $gwas = $row->get("GWAS");
                    $experiments = $row->get("Experiments");
                    $mappings = ["mouseNodeId"=> $row->get("mouseTermNodeId"), "mouseID"=> $mouseID, "mouseSynonyms"=>Mapper::get_term_synonyms($row->get("mouseID"), $row->get("mouseOnt"), $neo), "mouseLabel"=> $row->get("mouseTermLabel"), "experiments"=> $row->get("Experiments"),"mouseOnt"=> $row->get("mouseOnt"), "isExactMatch"=> $row->get("isExactMatch"), "humanNodeId"=> $row->get("humanTermNodeId"), "humanID"=> $humanID, "humanSynonyms"=>Mapper::get_term_synonyms($row->get("humanID"), $row->get("humanOnt"), $neo),"humanLabel"=> $row->get("humanTermLabel"), "gwas"=> $row->get("GWAS"), "humanOnt"=> $row->get("humanOnt"), "matches" => []];
                    $term_mapping_retrieved = true;
                }
                $gwas += $row->get("GWAS");
                $experiments += $row->get("Experiments");
                $match = ["mouseNodeId" => $row->get("mouseNodeId"), "mouseNodeType" => $row->get("mouseType"), "mouseLabel" => $row->get("mouseLabel"), "experiments" =>$row->get("Experiments"), "isExact" => $row->get("isExactMatch"), "humanNodeId" => $row->get("humanNodeId"), "humanNodeType" => $row->get("humanType"), "humanLabel" => $row->get("humanLabel"), "gwas" => $row->get("GWAS")];
                array_push($mappings["matches"], $match);
            }
            $mappings["gwas"] = $gwas;
            $mappings["experiments"] = $experiments;
            return $mappings;
        }

        public static function get_term_synonyms($termID, $ontology, $neo) {
            $ontology = strtoupper($ontology);
            $result = $neo->execute("MATCH (N:{$ontology})-[r:HAS_SYNONYM]-(S) 
            WHERE N.id = {termID}
            RETURN DISTINCT ID(S) AS SynonymID, S.FSN AS Synonym;", ["termID"=>$termID]);
            $synonyms = [];
            $usedLabels = [];
            foreach ($result as $row) {
                if (!in_array($row->get("Synonym"), $usedLabels)) {
                    array_push($synonyms, ["synonymId" => $row->get("SynonymID"), "synonymLabel" => $row->get("Synonym")]);
                    array_push($usedLabels, $row->get("Synonym"));
                }
            }
            return $synonyms;
        }

    }

?>