from py2neo import Graph
import argparse
import mysql.connector
import sys

from py2neo.wiring import Wire, WireError


class CacheBuilder:

    def __init__(self):
        self.db_connection = mysql.connector.connect(host="localhost", database="gc_mouse", user="root",
                                                     password="")
        self.db = self.db_connection.cursor()
        self.neo = Graph(scheme="bolt", host="localhost", password="12345", port="7687")

    def close_connection(self):
        self.db.close()
        self.db_connection.close()
        self.db_connection.disconnect()

    def get_all_ontology_terms(self, ontology):
        cmd = F"""MATCH (n:{ontology})
        WHERE n.isObsolete = "false" AND n:Term
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

    def get_ontology_terms(self, ontology):
        cmd = F"""MATCH (n:{ontology})
    WHERE n.isObsolete = "false" AND n:Term
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
	FROM GC_study.Study AS s
  INNER JOIN GC_study.Experiment AS e ON e.StudyID = s.StudyID
  INNER JOIN GC_study.PhenotypeMethod AS pm ON pm.PhenotypeMethodID = e.PhenotypeMethodID
  INNER JOIN GC_study.PPPA AS ppp ON ppp.PhenotypePropertyID = pm.PhenotypePropertyID
  INNER JOIN GC_study.PhenotypeAnnotation AS pa ON pa.PhenotypeAnnotationID = ppp.PhenotypeAnnotationID
  INNER JOIN GC_study.Resultset AS rs ON rs.ExperimentID = e.ExperimentID
  INNER JOIN GC_study.Significance AS si ON si.ResultsetID = rs.ResultsetID
  WHERE s.IsHidden = 'no' AND pa.PhenotypeIdentifier in ({''.join(test)})  AND si.NegLogPValue > 0; """.replace(",)", ")")
        results = self.db.execute(cmd, multi=True)
        for result in results:
            if result.with_rows:
                count = result.fetchall()
        self.db_connection.commit()
        if count:
            return count[0][0]
        else:
            return None

    def set_neo_gwas_count(self):
        cmd = F""" MATCH (n:Term)
        WHERE n:MESH OR n:HPO
        RETURN DISTINCT n.id
        """
        try:
            results = self.neo.run(cmd)
            for term in results:
                cmd = F"""MATCH (s:Study)-[:containsGWASResult]->(g:Result)<-[:hasGWASResult]-(n {{id: {term}}})
                    WITH DISTINCT s.id AS id, s.Name AS name, MAX(g.value) AS p_value, n
                    WITH COUNT(p_value) AS test, n
                    SET n.gwas_total = test"""
                self.neo.run(cmd)
        except WireError:
            print("Connection was closed prematurely, reconnecting...")
            self.neo = Graph(scheme="bolt", host="localhost", password="12345", port="7687")
            self.neo.run(cmd)
            print("Connected, resuming processing...")

    def get_term_experiment_count(self, terms):
        if terms == []:
            return 0
        terms = ["'" + term + "'" for term in terms]
        terms = ",".join(terms)

        cmd = F"""
            SELECT COUNT(DISTINCT mg.gene_symbol, mm.marker_accession_id, e.male_count, 
            e.female_count, ROUND(LOG((CONVERT(e.p_value, DECIMAL(30, 30)) + 0)) * -1, 3), 
            pr.name, pa.name, expa.parameter_stable_key, expr.procedure_stable_key) AS count
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
            WHERE (mp.mp_term_id in ({terms}) OR mptl.mp_term_id in ({terms}))
                AND ROUND(LOG((CONVERT(e.p_value, DECIMAL(30, 30)) + 0)) * -1, 3) > 0
        """
        results = self.db.execute(cmd, multi=True)
        for result in results:
            if result.with_rows:
                count = result.fetchall()
        self.db_connection.commit()
        if count:
            return count[0][0]
        else:
            return 0

    def set_neo_experiment_count(self, term, experiment_count):
        cmd = F""" MATCH (n:Term)
        WHERE n:MP
        RETURN DISTINCT n.id
        """
        try:
            results = self.neo.run(cmd)
            for term in results:
                cmd = F"""MATCH (s:Study)-[:containsExperimentResult]->(g:Result)<-[:hasExperimentResult]-(n {{id: {term}}})
                    WITH DISTINCT s.id AS id, s.Name AS name, MAX(g.value) AS p_value, n
                    WITH COUNT(p_value) AS test, n
                    SET n.experiment_total = test"""
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

    def get_significant_study_pval(self, termID):
        cmd = F"""
            SELECT s.Identifier AS 'ID', s.Name, MAX(si.NegLogPValue) AS 'NegLogPValue'
        FROM GC_study.Study AS s
          INNER JOIN GC_study.Experiment AS e ON e.StudyID = s.StudyID
          INNER JOIN GC_study.PhenotypeMethod AS pm ON pm.PhenotypeMethodID = e.PhenotypeMethodID
          INNER JOIN GC_study.PPPA AS ppp ON ppp.PhenotypePropertyID = pm.PhenotypePropertyID
          INNER JOIN GC_study.PhenotypeAnnotation AS pa ON pa.PhenotypeAnnotationID = ppp.PhenotypeAnnotationID
          INNER JOIN GC_study.Resultset AS rs ON rs.ExperimentID = e.ExperimentID
          INNER JOIN GC_study.Significance AS si ON si.ResultsetID = rs.ResultsetID
          WHERE pa.PhenotypeIdentifier = "{termID}" AND si.NegLogPValue >= 0 AND s.IsHidden = 'no'
          GROUP BY s.Identifier, s.Name;
        """
        self.db.execute(cmd)
        result = []
        for (id, name, pval) in self.db:
            if id and name and pval:
                result.append((id, name, pval))
        if result:
            return result
        else:
            return None

    def get_significant_experiment_pval(self, termID):
        cmd = """
            SELECT e.experiments_id, MAX(ROUND(LOG((CONVERT(e.p_value, DECIMAL(30, 30)) + 0)) * -1, 3)) AS 'p_value'
                FROM gc_mouse.experiments AS e
                INNER JOIN experiment_top_level_phenotypes AS etp ON etp.experiment_id = e.experiments_id
                INNER JOIN experiment_phenotypes AS ep ON ep.experiment_id = e.experiments_id
                INNER JOIN mp_phenotypes AS mptl ON mptl.mp_phenotype_id = etp.phenotype_id
                INNER JOIN mp_phenotypes AS mp ON mp.mp_phenotype_id = ep.phenotype_id
                WHERE mp.mp_term_id = '""" + termID + """' OR mptl.mp_term_id = '""" + termID + """'
                GROUP BY e.experiments_id
        """
        self.db.execute(cmd)
        result = None
        for (id, pval) in self.db:
            if id and pval:
                result = (id, pval)
        if result:
            return result
        else:
            return None

    def get_phenotype_gwas_records(self, termID):
        cmd = F"""
          SELECT DISTINCT s.Identifier AS 'ID', s.name
            FROM GC_study.Study AS s
              INNER JOIN GC_study.Experiment AS e ON e.StudyID = s.StudyID
              INNER JOIN GC_study.PhenotypeMethod AS pm ON pm.PhenotypeMethodID = e.PhenotypeMethodID
              INNER JOIN GC_study.PPPA AS ppp ON ppp.PhenotypePropertyID = pm.PhenotypePropertyID
              INNER JOIN GC_study.PhenotypeAnnotation AS pa ON pa.PhenotypeAnnotationID = ppp.PhenotypeAnnotationID
              INNER JOIN GC_study.resultset AS rs ON rs.ExperimentID = e.ExperimentID
              INNER JOIN GC_study.significance AS si ON si.ResultsetID = rs.ResultsetID
              WHERE pa.PhenotypeIdentifier = '{termID}';
        """
        self.db.execute(cmd)
        study = []
        for (id, name) in self.db:
            study.append((id, name))

        if study:
            return study
        else:
            return None

    def get_study_p_values(self, studyID):
        cmd = F"""
            SELECT TOP 1 si.NegLogPValue, pa.PhenotypeIdentifier
            FROM GC_study.Study AS s
              INNER JOIN GC_study.Experiment AS e ON e.StudyID = s.StudyID
              INNER JOIN GC_study.PhenotypeMethod AS pm ON pm.PhenotypeMethodID = e.PhenotypeMethodID
              INNER JOIN GC_study.PPPA AS ppp ON ppp.PhenotypePropertyID = pm.PhenotypePropertyID
              INNER JOIN GC_study.PhenotypeAnnotation AS pa ON pa.PhenotypeAnnotationID = ppp.PhenotypeAnnotationID
              INNER JOIN GC_study.resultset AS rs ON rs.ExperimentID = e.ExperimentID
              INNER JOIN GC_study.significance AS si ON si.ResultsetID = rs.ResultsetID
              WHERE s.Identifier = '{studyID}' AND s.IsHidden = 'no'
              ORDER BY NegLogPValue DESC;
        """
        results = self.db.execute(cmd, multi=True)
        p_vals = []
        for result in results:
            if result.with_rows:
                p_vals = result.fetchall()
        self.db_connection.commit()
        if p_vals:
            return p_vals
        else:
            return None

    def add_gwas_study(self, study_id, study_name):
        cmd = "MERGE (n:Study {Name: '" + study_name.replace("'", "\\'") + "', id: '" + study_id + "'})"
        try:
            self.neo.run(cmd)
        except WireError:
            print("Connection was closed prematurely, reconnecting...")
            self.neo = Graph(scheme="bolt", host="localhost", password="12345", port="7687")
            self.neo.run(cmd)
            print("Connected, resuming processing...")

    def add_experiment(self, experiment_id):
        cmd = "MERGE (n:Experiment {id: '" + str(experiment_id) + "'})"
        try:
            self.neo.run(cmd)
        except WireError:
            print("Connection was closed prematurely, reconnecting...")
            self.neo = Graph(scheme="bolt", host="localhost", password="12345", port="7687")
            self.neo.run(cmd)
            print("Connected, resuming processing...")

    def add_study_p_value(self, p_value, term_id, study_id):
        cmd = "MATCH (eStudy:Study {id: '" + study_id + "'}) MATCH (eTerm:MESH {id: '" + term_id + "'}) MERGE (eStudy)-[p:containsGWASResult]->(n:Result {value: " + str(
            p_value) + "})<-[r:hasGWASResult]-(eTerm)"
        try:
            self.neo.run(cmd)
        except WireError:
            print("Connection was closed prematurely, reconnecting...")
            self.neo = Graph(scheme="bolt", host="localhost", password="12345", port="7687")
            self.neo.run(cmd)
            print("Connected, resuming processing...")

    def add_experiment_p_value(self, p_value, term_id, experiment_id):
        cmd = "MATCH (eStudy:Experiment {id: '" + str(
            experiment_id) + "'}) MATCH (eTerm:MP {id: '" + term_id + "'}) MERGE (eStudy)-[p:containsExperimentResult]->(n:Result {value: " + str(
            p_value) + "})<-[r:hasExperimentResult]-(eTerm)"
        try:
            self.neo.run(cmd)
        except WireError:
            print("Connection was closed prematurely, reconnecting...")
            self.neo = Graph(scheme="bolt", host="localhost", password="12345", port="7687")
            self.neo.run(cmd)
            print("Connected, resuming processing...")

    def clear_study_cache(self):
        try:
            self.neo.run("MATCH (n:Study) DETACH DELETE n")
            self.neo.run("MATCH (n:Result) DETACH DELETE n")
            self.neo.run("MATCH (n:Experiment) DETACH DELETE n")
        except WireError:
            print("Connection was closed prematurely")


def set_study_counts(cache_builder):
    # cache_builder.clear_node_counts()  # Uncomment this line to reset all nodes to 0. Not really needed in most cases!
    print("Processing HPO terms...")
    hpo_terms = cache_builder.get_ontology_terms("HPO")
    for term in hpo_terms:
        hpo_descendants = [x for x in cache_builder.get_descendant_terms(term, "HPO") if x is not None]
        hpo_descendants.append(term)
        mesh_terms = []
        for descendant in hpo_descendants:
            new_mesh_term = cache_builder.get_mapped_mesh_term(descendant)
            if new_mesh_term:
                mesh_terms.append(new_mesh_term)
        mesh_term_descendants = []
        for mesh_term in mesh_terms:
            mesh_term_descendants += [x for x in cache_builder.get_descendant_terms(mesh_term, "MESH") if x is not None and x not in mesh_term_descendants]
        count = cache_builder.get_term_GWAS_count(mesh_term_descendants)
        cache_builder.set_neo_gwas_count(term, count)
    del mesh_term, mesh_term_descendants, hpo_terms, hpo_descendants
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


def build_study_cache():
    """
    Generate graph nodes for GWAS Studies and their p-values, linked to phenotypes.
    :return:
    """
    cache_builder = CacheBuilder()
    # GET HPO ID's
    hpo_terms = cache_builder.get_all_ontology_terms("HPO")
    for term in hpo_terms:
        mesh_mapped = cache_builder.get_mapped_mesh_term(term)
        significant_study_pvals = cache_builder.get_significant_study_pval(term)
        if significant_study_pvals:
            for study in significant_study_pvals:
                cache_builder.add_gwas_study(study[0], study[1])
                cache_builder.add_study_p_value(study[2], term, study[0])
    # Get MeSH ID's
    mesh_terms = cache_builder.get_all_ontology_terms("MESH")
    # Get studies linked to every phenotype currently listed in Neo4J
    for term in mesh_terms:
        significant_study_pvals = cache_builder.get_significant_study_pval(term)
        if significant_study_pvals:
            for study in significant_study_pvals:
                cache_builder.add_gwas_study(study[0], study[1])
                cache_builder.add_study_p_value(study[2], term, study[0])
    # Get mouse knockouts linked to every MP phenotype currently listed in Neo4J
    mp_terms = cache_builder.get_all_ontology_terms("MP")
    for term in mp_terms:
        significant_experiment_pval = cache_builder.get_significant_experiment_pval(term)
        if significant_experiment_pval:
            cache_builder.add_experiment(significant_experiment_pval[0])
            cache_builder.add_experiment_p_value(significant_experiment_pval[1], term, significant_experiment_pval[0])


def main():
    cache_builder = CacheBuilder()
    print("Connections established...")
    # cache_builder.clear_node_counts()
    # cache_builder.clear_study_cache()
    # set_study_counts(cache_builder)
    # build_study_cache()
    print("Cache generated.")
    # cache_builder.close_connection()
    # test = cache_builder.get_term_GWAS_count(["D005227", "D013229", "D005231", "D015777", "D001095", "D016718", "D015118", "D005229", "D009829", "D019301", "D015525", "D017962", "D004281", "D015118", "D044242", "D005228", "D008041", "D001095", "D016718", "D008042", "D017962", "D017965", "D043371", "D008041", "D017965", "D010169", "D019308", "D005232", "D000085", "D002087", "D058610", "D006885", "D020155"])
    # cache_builder.set_neo_experiment_count()
    cache_builder.set_neo_gwas_count()
    # print(test)


if __name__ == "__main__":
    main()
