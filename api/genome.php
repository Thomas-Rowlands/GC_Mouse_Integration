<?php
    include_once 'database.php';
    include_once 'studies.php';

    class Genome {

        public function __construct()
        {
            $this->con = new GC_Connection("gc_mouse");
            $this->neo = new Neo_Connection();
        }

        public function getPhenotypeMarkers($termID, $search_ont)
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
            $cmd = "SELECT hm.name, hm.chromosome AS 'chr', hm.start, hm.stop, hmr.NegLogPValue AS 'pval'
    FROM human_marker_results AS hmr
    INNER JOIN human_phenotypes AS hp ON hp.human_phenotypes_id = hmr.human_phenotypes_id
    INNER JOIN human_markers AS hm ON hm.human_markers_id = hmr.human_markers_id
    WHERE hp.mesh_id  in (" . $term_string . ")";
           $markers_result = $this->con->execute($cmd, "gc_mouse");
            if ($markers_result) {
                $markers = mysqli_fetch_all($markers_result, MYSQLI_ASSOC);
                foreach ($markers as $marker) {
                    array_push($result, $marker);
                }
            }
            
            if ($result)
                return $result;
            else
                return [];

        }

        public function getHumanGenes() 
        {
            $cmd = "SELECT hg.gene_symbol AS \"Gene\", chr.name AS \"Chromosome\", hg.start, hg.stop, CASE hom.human_gene_id WHEN NULL THEN 0 ELSE 1 END AS \"is_homolog\"
            FROM gc_mouse.human_genes AS hg
            INNER JOIN chromosomes AS chr ON chr.id = hg.chromosome_id
            RIGHT JOIN homologs AS hom ON hom.human_gene_id = hg.id;";
            $genes_result = $this->con->execute($cmd, "gc_mouse");
            $result = [];
            if ($genes_result) {
                $genes = mysqli_fetch_all($genes_result, MYSQLI_ASSOC);
                foreach ($genes as $gene) {
                    array_push($result, $gene);
                }
            }
            
            if ($result)
                return $result;
            else
                return [];
        }

        public function getMouseGenes()
        {
            $cmd = "SELECT mg.gene_symbol AS \"Gene\", chr.name AS \"Chromosome\", mg.start, mg.stop, CASE hom.mouse_gene_id WHEN NULL THEN 0 ELSE 1 END AS \"is_homolog\"
            FROM gc_mouse.mouse_genes AS mg
            INNER JOIN chromosomes AS chr ON chr.id = mg.chromosome_id
            RIGHT JOIN homologs AS hom ON hom.mouse_gene_id = mg.id;";
           $markers_result = $this->con->execute($cmd, "gc_mouse");
            if ($markers_result) {
                $markers = mysqli_fetch_all($markers_result, MYSQLI_ASSOC);
                foreach ($markers as $marker) {
                    array_push($result, $marker);
                }
            }
            
            if ($result)
                return $result;
            else
                return [];
        }

        public function getMouseKnockouts($termID, $ontology)
        {
            $ont = new Ontology();
            $mp_term = $ont->get_mp_mapping_by_id($termID);
            if ($mp_term)
                $mp_term = $mp_term[0];
            if ($mp_term) {
                $study = new StudySearch();
                $experiments = $study->get_mouse_knockouts($mp_term);
                if ($experiments)
                    return $experiments;
                else
                    return [];
            }
            return [];
        }

    }

?>