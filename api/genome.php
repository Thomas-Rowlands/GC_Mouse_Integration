<?php
    include_once 'database.php';

    class Genome {

        public function __construct()
        {
            $this->con = new GC_Connection("gc_mouse");
            $this->neo = new Neo_Connection();
        }

        public function getPhenotypeMarkers($termID)
        {
            $ont = new Ontology();
            $descendants = $ont->get_term_descendants($termID, "MESH");
            array_push($descendants, $termID);
            $result = [];
            $term_string = "";
            foreach ($descendants as $descendant) {
                $term_string .= "'" . str_replace(" ", "", $descendant) . "',";
            }
            $term_string = rtrim($term_string, ",");
            $cmd = "SELECT DISTINCT mg.gene_symbol AS \"Gene\", mm.marker_accession_id AS \"Gene Key\", e.male_count AS \"Males\", e.female_count AS \"Females\", ROUND(LOG((CONVERT(e.p_value, DECIMAL(30, 30)) + 0)) * -1, 3) AS \"-log P-value\", pr.name AS \"Procedure\", pa.name AS \"Parameter\",
            expa.parameter_stable_key AS \"Parameter Key\", expr.procedure_stable_key AS \"Procedure Key\"
            FROM experiments AS e
            INNER JOIN experiment_top_level_phenotypes AS etp ON etp.experiment_id = e.experiments_id
            INNER JOIN experiment_phenotypes AS ep ON ep.experiment_id = e.experiments_id
            INNER JOIN mp_phenotypes AS mptl ON mptl.mp_phenotype_id = etp.phenotype_id
            INNER JOIN mp_phenotypes AS mp ON mp.mp_phenotype_id = ep.phenotype_id
            INNER JOIN mouse_markers AS mm ON mm.mouse_gene_id = e.mouse_marker_id
            INNER JOIN mouse_genes AS mg ON mg.id = mm.mouse_gene_id
            INNER JOIN parameters AS pa ON pa.parameters_id = e.parameter_id
            INNER JOIN experiment_parameter AS expa ON expa.experiment_id = e.experiments_id
            INNER JOIN procedures AS pr ON pr.procedures_id = e.procedure_id
            INNER JOIN experiment_procedure AS expr ON expr.experiment_id = e.experiments_id
            WHERE (mp.mp_term_id in ($term_string) OR mptl.mp_term_id in ($term_string))
                AND ROUND(LOG((CONVERT(e.p_value, DECIMAL(30, 30)) + 0)) * -1, 3) > 0";
            $knockout = $this->con->execute($cmd, "gc_mouse");
            if ($knockout) {
                $knockout_records = mysqli_fetch_all($knockout, MYSQLI_ASSOC);
                foreach ($knockout_records as $record) {
                    array_push($result, $record);
                }
            }
            
            if ($result)
                return $result;
            else
                return [];

        }
    }

?>