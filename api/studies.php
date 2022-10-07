<?php
    include_once 'database.php';
    include_once 'utility.php';
    include_once 'ontology.php';
    include_once 'mappings.php';
    include_once 'genome.php';

    class StudySearch {

        /**
         * @var GC_Connection
         */
        private $con;
        /**
         * @var Neo_Connection
         */
        private $neo;

        public function __construct(){
            $this->con = new GC_Connection("gc_mouse");
            $this->neo = new Neo_Connection();
        }

        public function get_phenotype_homology_breakdown($mouseID, $humanID, $humanOnt): array
        {
            $humanOnt = strtoupper($humanOnt);
            $return_package = ["Mappings" => Mapper::getMappings($mouseID, $humanID, $humanOnt, $this->neo),
                "GWAS Studies" => [], "Gene Knockouts" => [], "Homologous Genes" => []];
            // Get GWAS Studies
            if ($return_package["Mappings"]) {
                $return_package["GWAS Studies"] = $return_package["Mappings"]["hasHumanData"] ?
                    $this->get_mapped_gwas_studies($humanOnt, $return_package["Mappings"]["humanID"]) : [];
                $return_package["Gene Knockouts"] = $return_package["Mappings"]["hasMouseData"] ?
                    $this->get_mouse_knockouts($return_package["Mappings"]["mouseID"]) : [];
            }
            return $return_package;
        }

        public function get_mouse_term_breakdown($mouseID, $targetOnt): array
        {
            $ont = new Ontology();
            // Get mouse knockouts
            $return_package = ["Mappings" => $ont->get_human_mapping_by_id($mouseID, $targetOnt),
                "GWAS Studies" => [], "Gene Knockouts" => $this->get_mouse_knockouts($mouseID),
                "Homologous Genes" => []];
            // Get knockouts
            if ($return_package["Mappings"]) {
                $inferred_gwas = $this->get_mapped_gwas_studies($targetOnt, $return_package["Mappings"][0]["mappedID"]);
                foreach ($inferred_gwas as $gwas)
                    $return_package["GWAS Studies"][] = $gwas;
            }
            return $return_package;
        }

        public function get_human_term_breakdown($humanID, $ontology): array
        {
            $ont = new Ontology();
            $return_package = ["Mappings" => $ont->get_mp_mapping_by_id($humanID),
                "GWAS Studies" => $this->get_mapped_gwas_studies($ontology, $humanID),
                "Homologous Genes" => [],
                "Gene Knockouts" => []];

            // Get knockouts
            if ($return_package["Mappings"]) {
                $inferred_knockouts = $this->get_mouse_knockouts($return_package["Mappings"][0]["mappedID"]);
                foreach ($inferred_knockouts as $knockout)
                    if (!in_array($knockout, $return_package["Gene Knockouts"]))
                        $return_package["Gene Knockouts"][] = $knockout;
            }
            return $return_package;
        }

        public function get_mapped_gwas_studies($ontology, $termID): array
        {
            $ont = new Ontology();
            $result = $this->neo->execute("MATCH (s:Study)-[:containsGWASResult]->(g:Result)<-[:hasGWASResult]-(n:$ontology {id: '$termID'})
            USING INDEX n:$ontology(id)
            RETURN DISTINCT s.id AS id, s.Name AS name, MAX(g.value) AS p_value", []);
            $studies = [];
            if ($result)
                foreach ($result as $row) {
                    $studies[] = ["id" => $row->get("id"), "name" => $row->get("name"), "-log P-value" => round($row->get("p_value"), 2)];
                }
            return $studies;
        }

        public function get_mesh_id_from_db($termID) {
            $cmd = "CALL gc_mouse.get_mesh_mapping('$termID')";
            $cursor = $this->con->execute($cmd, "gc_mouse");
            $mesh_term = null;
            if ($cursor) {
                $result = mysqli_fetch_all($cursor, MYSQLI_ASSOC);
                foreach ($result as $term) {
                    $mesh_term = $term["meshID"];
                }
            }
            return $mesh_term;
        }

        public function get_mouse_knockouts($termID): array
        {
            $result = $this->neo->execute("MATCH (term:MP {id: \"$termID\"})-[:hasExperimentResult]->(r)<-[:containsExperimentResult]-(e)
                USING INDEX term:MP(id)
                WITH r, e
                MATCH (e)-[:studiesTheGene]->(g)
                WITH r, e, g
                MATCH (e)-[:usesProcedure]->(p)
                WITH r, e, g, p
                MATCH (e)-[:assessesParameter]->(pa)
                WITH r, e, g, p, pa
                RETURN g.name AS Gene, g.mgi AS `Gene Key`, e.maleCount AS Males, 
                e.femaleCount AS Females, r.value AS `-log P-value`, p.name AS Procedure, pa.name AS Parameter", []);
            $return_package = [];
            if ($result) {
                foreach ($result as $record) {
                    $return_package[] = ["Gene"=>$record->get("Gene"), "Gene Key"=>$record->get("Gene Key"),
                        "Males"=>$record->get("Males"), "Females"=>$record->get("Females"),
                        "-log P-value"=>$record->get("-log P-value"), "Procedure"=>$record->get("Procedure"),
                        "Parameter"=>$record->get("Parameter")];
                }
                return $return_package;
            } else
                return [];
        }

        public function search_by_term($user_input, $species, $exact=false): array
        {
            $species = strtolower($species);
            $ont = new Ontology();
            if ($exact) {
                if ($species == "mouse") {
                    //$mapped_hpo_terms = $ont->search_mouse_term($user_input, "HPO", true, $human_pval, $mouse_pval);
                    $mapped_terms = $ont->search_mouse_term($user_input, null, true);
                } else {
//                    $mapped_hpo_terms = $ont->search_human_term($user_input, "HPO", true);
                    $mapped_terms = $ont->search_human_term($user_input, "MESH", true);
                }
            } else {
                if ($species == "mouse") {
//                    $mapped_hpo_terms = $ont->search_mouse_term($user_input, "HPO", true, $human_pval, $mouse_pval);
                    $mapped_terms = $ont->search_mouse_term($user_input, null);
                } else {
//                    $mapped_hpo_terms = $ont->search_human_term($user_input, "HPO");
                    $mapped_terms = $ont->search_human_term($user_input, "MESH");
                }
            }

            //$mapped_terms = array_merge($mapped_hpo_terms, $mapped_mesh_terms);
            $results = [];
            $mouseIDs = [];
            $humanIDs = [];
            foreach ($mapped_terms as $mapping) {
                $skip_duplicate = false; //filter out duplicates which do not have a mapped ID
                // Check if at least 1 GWAS or Knockout is present for this phenotype
                if ($species == "mouse")
                    if (in_array($mapping["id"], $mouseIDs)) {
                        if (!$mapping["mappedID"])
                            $skip_duplicate = true;
                    } else
                        $mouseIDs[] = $mapping["id"];
                else
                    if (in_array($mapping["id"], $humanIDs)) {
                        if (!$mapping["mappedID"])
                            $skip_duplicate = true;
                    } else
                        $humanIDs[] = $mapping["id"];
                if (!$skip_duplicate) {
                    if ($species == "mouse") {
                        $humanOnt = $mapping["mappedOnt"];
                        $humanID = $mapping["mappedID"];
                        $humanLabel = $mapping["mappedLabel"];
                        $humanSynonyms = $mapping["mappedSynonyms"];
                        $gwas = $mapping["gwas"];
                        $experiments = $mapping["experiments"];
                        $mouseID = $mapping["id"];
                        $mouseLabel = $mapping["label"];
                        $mouseSynonyms = $mapping["synonyms"];
                    } else {
                        $humanOnt = $mapping["ont"];
                        $humanID = $mapping["id"];
                        $humanLabel = $mapping["label"];
                        $humanSynonyms = $mapping["synonyms"];
                        $mouseID = $mapping["mappedID"];
                        $mouseLabel = $mapping["mappedLabel"];
                        $mouseSynonyms = $mapping["mappedSynonyms"];
                        $experiments = $mapping["experiments"];
                        $gwas = $mapping["gwas"];
                    }
                    $result = ["Human Ontology"=>$humanOnt, "ID"=>$humanID, "Human Phenotype"=>$humanLabel, "Human Synonyms"=>$humanSynonyms,
                    "MP ID"=>$mouseID, "MP Label"=>$mouseLabel, "Mouse Synonyms"=>$mouseSynonyms,
                    "GWAS Studies"=>$gwas, "Mouse Knockouts"=>$experiments];
                    $results[] = $result;
                }
            }


            $total = count($results);
            if ($total > 0)
                return [$results, $total];
            else
                return [null, 0];
        }

        public function homologSearch($mpid): ?array
        {
            $mpid = $this->con->escape_input($mpid);
            $results = $this->con->execute("CALL gc_mouse.get_mouse_knockout_by_term('$mpid');", "gc_mouse");
            if ($results) {
                $total = $results->num_rows;
                return array(mysqli_fetch_all($results, MYSQLI_ASSOC), $total);
            } else {
                return null;
            }
        }

    }
