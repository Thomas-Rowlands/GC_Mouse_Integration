from py2neo import Graph
import argparse
import mysql.connector
import sys

from py2neo.wiring import Wire, WireError


class CacheBuilder:

    def __init__(self):
        self.db_connection = mysql.connector.connect(host="localhost", database="gc_mouse", user="lampuser",
                                                     password="changeme")
        self.db = self.db_connection.cursor()
        self.neo = Graph(scheme="bolt", host="localhost", password="12345", port="7687")

    def close_connection(self):
        self.db.close()
        self.db_connection.close()
        self.db_connection.disconnect()

    def get_ontology_terms(self, ontology):
        cmd = F"""MATCH (n:{ontology})
    WHERE n.gwas_total = 0 AND n.isObsolete = "false" AND n:Term
    RETURN n.id AS termID"""
        terms = []
        try:
            cursor = self.neo.run(cmd)
            terms = []
            while cursor.forward():
                terms.append(cursor.current[0])
        except WireError:
            print("Connection was closed prematurely, reconnecting...")
            self.neo = Graph(scheme="bolt", host="localhost", password="12345", port="7687")
            cursor = self.neo.run(cmd)
            terms = []
            while cursor.forward():
                terms.append(cursor.current[0])
            print("Connected, resuming processing...")
        return terms

    def get_descendant_terms(self, term, ontology):
        cmd = f""" MATCH (n:{ontology})<-[:ISA*1..]-(m)
        WHERE n.id = "{term}" AND m.isObsolete = "false"
        RETURN m.id AS termID"""
        descendants = [term]
        try:
            cursor = self.neo.run(cmd)
            while cursor.forward():
                record = cursor.current[0]
                if record not in descendants:
                    descendants.append(record)
        except WireError:
            print("Connection was closed prematurely, reconnecting...")
            self.neo = Graph(scheme="bolt", host="localhost", password="12345", port="7687")
            cursor = self.neo.run(cmd)
            while cursor.forward():
                record = cursor.current[0]
                if record not in descendants:
                    descendants.append(record)
            print("Connected, resuming processing...")

        return descendants    

    def get_mapped_mesh_term(self, term):
        results = self.db.execute(F"""SELECT meshID FROM ontology_partial.hpo2mesh WHERE hpoID = "{term}" """,
                                  multi=True)
        meshID = None
        for result in results:
            if result.with_rows:
                meshID = result.fetchall()
        self.db_connection.commit()
        if meshID:
            return meshID[0][0]
        else:
            return None

    def get_term_GWAS_count(self, terms):
        if terms == []:
            return 0
        test = ["'" + term + "'," for term in terms]
        cmd = F"""SELECT COUNT(DISTINCT(s.Identifier)) AS Total
	FROM gc_study.study AS s
  INNER JOIN GC_study.Experiment AS e ON e.StudyID = s.StudyID
  INNER JOIN GC_study.PhenotypeMethod AS pm ON pm.PhenotypeMethodID = e.PhenotypeMethodID
  INNER JOIN GC_study.PPPA AS ppp ON ppp.PhenotypePropertyID = pm.PhenotypePropertyID
  INNER JOIN GC_study.PhenotypeAnnotation AS pa ON pa.PhenotypeAnnotationID = ppp.PhenotypeAnnotationID
  INNER JOIN GC_study.resultset AS rs ON rs.ExperimentID = e.ExperimentID
  INNER JOIN GC_study.significance AS si ON si.ResultsetID = rs.ResultsetID
  WHERE pa.PhenotypeIdentifier in ({''.join(test)})  AND si.NegLogPValue > 0; """.replace(",)", ")")
        results = self.db.execute(cmd, multi=True)
        for result in results:
            if result.with_rows:
                count = result.fetchall()
        self.db_connection.commit()
        if count:
            return count[0][0]
        else:
            return None

    def set_neo_gwas_count(self, term, gwas_count):
        cmd = F""" MATCH (n)
        WHERE n.id = "{term}"
        SET n.gwas_total = {gwas_count}
        """
        try:
            self.neo.run(cmd)
        except WireError:
            print("Connection was closed prematurely, reconnecting...")
            self.neo = Graph(scheme="bolt", host="localhost", password="12345", port="7687")
            self.neo.run(cmd)
            print("Connected, resuming processing...")

    def get_term_experiment_count(self, terms):
        if terms == []:
            return 0
        test = ["'" + term + "'," for term in terms]
        cmd = F"""SELECT COUNT(DISTINCT(e.experiments_id)) AS Total
			FROM experiments AS e
			INNER JOIN experiment_top_level_phenotypes AS etp ON etp.experiment_id = e.experiments_id
			INNER JOIN experiment_phenotypes AS ep ON ep.experiment_id = e.experiments_id
			INNER JOIN mp_phenotypes AS mptl ON mptl.mp_phenotype_id = etp.phenotype_id
			INNER JOIN mp_phenotypes AS mp ON mp.mp_phenotype_id = ep.phenotype_id
			INNER JOIN mouse_markers AS mm ON mm.mouse_gene_id = e.mouse_marker_id
			INNER JOIN mouse_genes AS mg ON mg.id = mm.mouse_gene_id
			INNER JOIN parameters AS pa ON pa.parameters_id = e.parameter_id
	        WHERE (mp.mp_term_id in ({''.join(test)}) OR mptl.mp_term_id in ({''.join(test)}))
			    AND ROUND(LOG((CONVERT(e.p_value, DECIMAL(30, 30)) + 0)) * -1, 3) > 0""".replace(",)", ")")
        results = self.db.execute(cmd, multi=True)
        for result in results:
            if result.with_rows:
                count = result.fetchall()
        self.db_connection.commit()
        if count:
            return count[0][0]
        else:
            return None

    def set_neo_experiment_count(self, term, experiment_count):
        cmd = F""" MATCH (n)
        WHERE n.id = "{term}"
        SET n.experiment_total = {experiment_count}
        """
        try:
            self.neo.run(cmd)
        except WireError:
            print("Connection was closed prematurely, reconnecting...")
            self.neo = Graph(scheme="bolt", host="localhost", password="12345", port="7687")
            self.neo.run(cmd)
            print("Connected, resuming processing...")

    def clear_node_counts(self):
        cmd = """ MATCH (n)
        SET n.gwas_total = 0
        SET n.experiment_total = 0
        """
        try:
            self.neo.run(cmd)
        except WireError:
            print("Connection was closed prematurely, reconnecting...")
            self.neo = Graph(scheme="bolt", host="localhost", password="12345", port="7687")
            self.neo.run(cmd)
            print("Connected, resuming processing...")


def main():
    cache_builder = CacheBuilder()
    print("Connections established...")
    cache_builder.clear_node_counts()  # Uncomment this line to reset all nodes to 0. Not really needed in most cases!
    print("Processing HPO terms...")
    hpo_terms = cache_builder.get_ontology_terms("HPO")
    for term in hpo_terms:
        mesh_term = cache_builder.get_mapped_mesh_term(term)
        children = [x for x in cache_builder.get_descendant_terms(mesh_term, "MESH") if x is not None]
        count = cache_builder.get_term_GWAS_count(children)
        cache_builder.set_neo_gwas_count(term, count)
    print("Processing MeSH terms...")
    mesh_terms = cache_builder.get_ontology_terms("MESH")
    for term in mesh_terms:
        children = [x for x in cache_builder.get_descendant_terms(term, "MESH") if x is not None]
        children.append(term)
        count = cache_builder.get_term_GWAS_count(children)
        cache_builder.set_neo_gwas_count(term, count)
    print("Processing MP terms...")
    mp_terms = cache_builder.get_ontology_terms("MP")
    for term in mp_terms:
        children = [x for x in cache_builder.get_descendant_terms(term, "MP") if x is not None]
        children.append(term)
        count = cache_builder.get_term_experiment_count(children)
        cache_builder.set_neo_experiment_count(term, count)
    print("Cache generated.")
    cache_builder.close_connection()


if __name__ == "__main__":
    main()
