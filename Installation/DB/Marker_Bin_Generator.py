import mysql.connector


class BinBuilder:

    def __init__(self):
        self.db_connection = mysql.connector.connect(host="localhost", database="GC_study", user="lampuser",
                                                     password="changeme")
        self.db = self.db_connection.cursor()
        # Chromosome lengths taken from https://www.ncbi.nlm.nih.gov/grc/human/data?asm=GRCh37
        self.__chromosomes = {
            1: 249250621,
            2: 243199373,
            3: 198022430,
            4: 191154276,
            5: 180915260,
            6: 171115067,
            7: 159138663,
            8: 146364022,
            9: 141213431,
            10: 135534747,
            11: 135006516,
            12: 133851895,
            13: 115169878,
            14: 107349540,
            15: 102531392,
            16: 90354753,
            17: 81195210,
            18: 78077248,
            19: 59128983,
            20: 63025520,
            21: 48129895,
            22: 51304566,
            "X": 155270560,
            "Y": 59373566
        }

    def close_connection(self):
        self.db.close()
        self.db_connection.close()
        self.db_connection.disconnect()

    def get_used_mesh_phenotypes(self):
        cmd = """
        SELECT DISTINCT pa.PhenotypeIdentifier
        FROM GC_study.Study AS s
            INNER JOIN GC_study.Experiment AS e ON e.StudyID = s.StudyID
            INNER JOIN GC_study.PhenotypeMethod AS pm ON pm.PhenotypeMethodID = e.PhenotypeMethodID
            INNER JOIN GC_study.PPPA AS ppp ON ppp.PhenotypePropertyID = pm.PhenotypePropertyID
            INNER JOIN GC_study.PhenotypeAnnotation AS pa ON pa.PhenotypeAnnotationID = ppp.PhenotypeAnnotationID
            INNER JOIN GC_study.Resultset AS rs ON rs.ExperimentID = e.ExperimentID
            INNER JOIN GC_study.Significance AS si ON si.ResultsetID = rs.ResultsetID
            INNER JOIN GC_study.Usedmarkerset AS us ON us.UsedmarkersetID = si.UsedmarkersetID
            INNER JOIN GC_marker.Marker AS m ON m.Identifier = us.MarkerIdentifier
            INNER JOIN GC_marker.MarkerCoord AS mc ON mc.MarkerID = m.MarkerID;
        """
        results = self.db.execute(cmd, multi=True)
        terms = []
        for result in results:
            if result.with_rows:
                terms = [x for [(x)] in result.fetchall()]
        return terms

    def get_used_mp_phenotypes(self):
        cmd = """
            SELECT DISTINCT terms.mp_term_id
            FROM (
                    SELECT DISTINCT mp.mp_term_id
                FROM gc_mouse.human_genes AS hg
                    INNER JOIN gc_mouse.chromosomes AS chr ON chr.id = hg.chromosome_id
                    INNER JOIN gc_mouse.homologs AS hom ON hom.human_gene_id = hg.id
                    INNER JOIN gc_mouse.mouse_genes AS mg ON mg.id = hom.mouse_gene_id
                    INNER JOIN gc_mouse.mouse_markers AS mm ON mm.mouse_gene_id = mg.id
                    INNER JOIN gc_mouse.experiments AS exp ON exp.mouse_marker_id = mm.mouse_marker_id
                    INNER JOIN gc_mouse.experiment_phenotypes AS ephen ON ephen.experiment_id = exp.experiments_id
                    INNER JOIN gc_mouse.experiment_top_level_phenotypes AS etphen ON etphen.experiment_id = exp.experiments_id
                    INNER JOIN gc_mouse.mp_phenotypes AS mp ON mp.mp_phenotype_id = ephen.phenotype_id
                    INNER JOIN gc_mouse.mp_phenotypes AS tmp ON tmp.mp_phenotype_id = etphen.phenotype_id
                UNION
                    SELECT DISTINCT tmp.mp_term_id
                    FROM gc_mouse.human_genes AS hg
                        INNER JOIN gc_mouse.chromosomes AS chr ON chr.id = hg.chromosome_id
                        INNER JOIN gc_mouse.homologs AS hom ON hom.human_gene_id = hg.id
                        INNER JOIN gc_mouse.mouse_genes AS mg ON mg.id = hom.mouse_gene_id
                        INNER JOIN gc_mouse.mouse_markers AS mm ON mm.mouse_gene_id = mg.id
                        INNER JOIN gc_mouse.experiments AS exp ON exp.mouse_marker_id = mm.mouse_marker_id
                        INNER JOIN gc_mouse.experiment_phenotypes AS ephen ON ephen.experiment_id = exp.experiments_id
                        INNER JOIN gc_mouse.experiment_top_level_phenotypes AS etphen ON etphen.experiment_id = exp.experiments_id
                        INNER JOIN gc_mouse.mp_phenotypes AS mp ON mp.mp_phenotype_id = ephen.phenotype_id
                        INNER JOIN gc_mouse.mp_phenotypes AS tmp ON tmp.mp_phenotype_id = etphen.phenotype_id
            ) AS terms;
        """
        results = self.db.execute(cmd, multi=True)
        terms = []
        for result in results:
            if result.with_rows:
                terms = [x for [(x)] in result.fetchall()]
        return terms

    def get_chromosome_id(self, chromosome):
        cmd = F"SELECT id FROM gc_mouse.chromosomes WHERE name = '{chromosome}'"
        results = self.db.execute(cmd, multi=True)
        id = None
        for result in results:
            if result.with_rows:
                id = result.fetchall()[0][0]
        return id

    def insert_phenotype_bin_value(self, term_id, chromosome):
        cmd = F"""INSERT INTO GC_bin.human_markers_chr{chromosome} (bin, value, mesh_id, highest_significance) 
(
	SELECT 3mb_Bin, COUNT(*) AS 'value', '{term_id}', 
		 GREATEST(
			IF(significanceList1_Pheno LIKE '%{term_id}|%', 1, 0),
            IF(significanceList2_Pheno LIKE '%{term_id}|%', 2, 0),
            IF(significanceList3_Pheno LIKE '%{term_id}|%', 3, 0),
            IF(significanceList4_Pheno LIKE '%{term_id}|%', 4, 0),
            IF(significanceList5_Pheno LIKE '%{term_id}|%', 5, 0),
            IF(significanceList6_Pheno LIKE '%{term_id}|%', 6, 0),
            IF(significanceList7_Pheno LIKE '%{term_id}|%', 7, 0),
            IF(significanceList8_Pheno LIKE '%{term_id}|%', 8, 0),
            IF(significanceList9_Pheno LIKE '%{term_id}|%', 9, 0),
            IF(significanceList10_Pheno LIKE '%{term_id}|%', 10, 0)
         ) AS highest_significance
	FROM gc_browser.marker_significances_chr{chromosome}
	WHERE 3mb_bin > 0 AND SignificanceList0_Pheno LIKE '%{term_id}|%'
	GROUP BY 3mb_Bin
);"""
        self.db.execute(cmd)
        self.db_connection.commit()

    def insert_mouse_phenotype_bin_value(self, term_id, chromosome, bin):
        start = (bin - 1) * 3000000
        stop = bin * 3000000 if bin * 3000000 < self.__chromosomes[chromosome] else self.__chromosomes[chromosome]
        cmd = F"""
        INSERT IGNORE INTO GC_bin.mouse_knockouts_chr{chromosome} (bin, value, mp_id, highest_significance) 
        (
            SELECT {bin}, COUNT(*) AS value, '{term_id}', MAX(ROUND(LOG((CONVERT(exp.p_value, DECIMAL(30, 30)) + 0)) * -1, 3)) AS "highest_significance"
            FROM gc_mouse.human_genes AS hg
                INNER JOIN gc_mouse.chromosomes AS chr ON chr.id = hg.chromosome_id
                INNER JOIN gc_mouse.homologs AS hom ON hom.human_gene_id = hg.id
                INNER JOIN gc_mouse.mouse_genes AS mg ON mg.id = hom.mouse_gene_id
                INNER JOIN gc_mouse.mouse_markers AS mm ON mm.mouse_gene_id = mg.id
                INNER JOIN gc_mouse.experiments AS exp ON exp.mouse_marker_id = mm.mouse_marker_id
                INNER JOIN gc_mouse.experiment_phenotypes AS ephen ON ephen.experiment_id = exp.experiments_id
                INNER JOIN gc_mouse.experiment_top_level_phenotypes AS etphen ON etphen.experiment_id = exp.experiments_id
                INNER JOIN gc_mouse.mp_phenotypes AS mp ON mp.mp_phenotype_id = ephen.phenotype_id
                INNER JOIN gc_mouse.mp_phenotypes AS tmp ON tmp.mp_phenotype_id = etphen.phenotype_id
            WHERE (mp.mp_term_id = '{term_id}' OR tmp.mp_term_id = '{term_id}') AND chr.name = '{chromosome}' AND hg.start BETWEEN {start} AND {stop}
            HAVING COUNT(*) > 0
        );"""
        self.db.execute(cmd)
        self.db_connection.commit()

    def build_marker_bins(self):
        mesh_terms = self.get_used_mesh_phenotypes()
        for chromosome in self.__chromosomes:
            print(F"Processing chromosome {chromosome}")
            for term in mesh_terms:
                self.insert_phenotype_bin_value(term, chromosome)
            print(F"Finished processing chromosome {chromosome}")


    def build_knockout_bins(self):
        mp_terms = self.get_used_mp_phenotypes()
        for chromosome in self.__chromosomes:
            print(F"Processing chromosome {chromosome}")
            for term in mp_terms:
                bin = 1
                while (bin - 1) * 3000000 < self.__chromosomes[chromosome]:
                    self.insert_mouse_phenotype_bin_value(term, chromosome, bin)
                    bin += 1
            print(F"Finished processing chromosome {chromosome}")


if __name__ == "__main__":
    builder = BinBuilder()
    builder.build_marker_bins()
    builder.build_knockout_bins()
