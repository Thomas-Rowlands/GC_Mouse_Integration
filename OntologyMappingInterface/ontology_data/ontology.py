import sys

import rdflib
import owlready2
from lxml import etree
import json
import csv
import codecs
import pathlib
from py2neo import Graph
import config


class Node:
    parent = None
    name = ""
    synonyms = []
    ont_id = None
    children = []

    def __init__(self, name, ont_id, parent=None):
        self.name = name
        self.ont_id = ont_id
        self.parent = parent
        self.synonyms = []
        self.children = []


class EFO:
    efo_namespace = rdflib.namespace.Namespace(
        "http://www.ebi.ac.uk/efo/efo.owl")
    efo_namespaces = {"owl": rdflib.namespace.OWL,
                      "rdf": rdflib.namespace.RDF, "rdfs": rdflib.namespace.RDFS}

    sparql_query = """
PREFIX owl:  <http://www.w3.org/2002/07/owl#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT DISTINCT ?root ?label ?syn ?super
WHERE {
   ?root a owl:Class .
   ?root rdfs:label ?label .
   OPTIONAL {
   ?root <http://www.geneontology.org/formats/oboInOwl#hasExactSynonym> ?syn .
     }
   OPTIONAL {
       ?root rdfs:subClassOf ?super
   }
}

    """

    @staticmethod
    def update_terms():
        results = {"name": "Experimental Factor Ontology", "children": []}
        try:
            directory = pathlib.Path().absolute()
            owlready2.onto_path.append(directory)
            print(F"{directory}\ontology_data\efo.owl")
            ont = owlready2.get_ontology(F"{directory}\ontology_data\efo.owl")

            ont.load()
            g = owlready2.default_world.as_rdflib_graph()
            hpo_ontology_terms = g.query(
                HPO.sparql_query, initNs=HPO.hp_namespaces)
            g.close()
            for (id, label, syn, parent) in hpo_ontology_terms:
                termID = id.toPython()[id.toPython().rfind("/") + 1:]
                isSynonymRecord = False
                for entry in results["children"]:
                    if entry.ont_id == termID:
                        if syn:
                            if syn.toPython() not in entry.synonyms:
                                entry.synonyms.append(syn.toPython())
                        isSynonymRecord = True
                        break
                if isSynonymRecord:
                    continue
                if parent:
                    parent = parent.toPython(
                    )[parent.toPython().rfind("/") + 1:]
                node = Node(label.toPython(), termID, parent=parent)
                if syn:
                    node.synonyms.append(syn.toPython())
                results["children"].append(node)
            results["children"] = [x.__dict__ for x in results["children"]]
            output = json.dumps(results)
            file = open(F"{directory}\ontology_cache\efo.json", "w")
            file.write(output)
            file.close()
        except IOError as io:
            sys.exit(
                F"IO error storing new HPO terms: {io.errno} -> {io.strerror}")
        except BaseException as ex:
            sys.exit(
                F"An unexpected error occurred whilst storing new HPO terms: {ex}")
        return results


class Mesh:

    @staticmethod
    def update_terms():
        directory = pathlib.Path().absolute()
        print(F"{directory}\ontology_data\mesh.owl")
        graph = Graph(user=config.NEO_USER, password=config.NEO_PASS,
                      bolt_port=config.NEO_BOLT_PORT)
        graphResult = graph.run("""match (p)<-[:ISA]-()-[:HAS_CONCEPT]->(n:MESH{isObsolete: "false"})-[r:HAS_SYNONYM]->(s{isObsolete: "false"})
RETURN n.FSN AS TermName, n.id AS TermID, n.originalType AS TermType, s.FSN AS SynonymName, s.id AS SynonymID, s.originalType AS SynonymType, p.FSN AS ParentName, p.id AS ParentID, p.originalType AS ParentType """).data()
        results = {"name": "Human Phenotype Ontology", "children": []}
        for entry in graphResult:
            termID = entry["TermID"]
            isSynonymRecord = False
            for child in results["children"]:
                if child.ont_id == termID:
                    if entry["SynonymName"]:
                        if entry["SynonymName"] not in child.synonyms:
                            child.synonyms.append(entry["SynonymName"])
                    isSynonymRecord = True
                    break
            if isSynonymRecord:
                continue
            node = Node(entry["TermName"], entry["TermID"],
                        parent=entry["ParentName"])
            if entry["SynonymName"]:
                node.synonyms.append(entry["SynonymName"])
            results["children"].append(node)
        results["children"] = [x.__dict__ for x in results["children"]]
        output = json.dumps(results)
        file = open(F"{directory}\ontology_cache\mesh.json", "w")
        file.write(output)
        file.close()


class HPO:
    hp_namespaces = {"owl": rdflib.namespace.OWL,
                     "rdf": rdflib.namespace.RDF, "rdfs": rdflib.namespace.RDFS}

    sparql_query = """
PREFIX owl:  <http://www.w3.org/2002/07/owl#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT DISTINCT ?root ?label ?syn ?super
WHERE {
   ?root a owl:Class .
   ?root rdfs:label ?label .
   OPTIONAL {
   ?root <http://www.geneontology.org/formats/oboInOwl#hasExactSynonym> ?syn .
     }
   OPTIONAL {
       ?root rdfs:subClassOf ?super
   }
}

    """

    @staticmethod
    def update_terms():
        results = {"name": "Human Phenotype Ontology", "children": []}
        try:
            directory = pathlib.Path().absolute()
            owlready2.onto_path.append(directory)
            print(F"{directory}\ontology_data\hpo.owl")
            ont = owlready2.get_ontology(F"{directory}\ontology_data\hpo.owl")

            ont.load()
            g = owlready2.default_world.as_rdflib_graph()
            hpo_ontology_terms = g.query(
                HPO.sparql_query, initNs=HPO.hp_namespaces)
            g.close()
            for (id, label, syn, parent) in hpo_ontology_terms:
                termID = id.toPython()[id.toPython().rfind("/") + 1:]
                isSynonymRecord = False
                for entry in results["children"]:
                    if entry.ont_id == termID:
                        if syn:
                            if syn.toPython() not in entry.synonyms:
                                entry.synonyms.append(syn.toPython())
                        isSynonymRecord = True
                        break
                if isSynonymRecord:
                    continue
                if parent:
                    parent = parent.toPython(
                    )[parent.toPython().rfind("/") + 1:]
                node = Node(label.toPython(), termID, parent=parent)
                if syn:
                    node.synonyms.append(syn.toPython())
                results["children"].append(node)
            results["children"] = [x.__dict__ for x in results["children"]]
            output = json.dumps(results)
            file = open(F"{directory}\ontology_cache\hpo.json", "w")
            file.write(output)
            file.close()
        except IOError as io:
            sys.exit(
                F"IO error storing new HPO terms: {io.errno} -> {io.strerror}")
        except BaseException as ex:
            sys.exit(
                F"An unexpected error occurred whilst storing new HPO terms: {ex}")
        return results

    @staticmethod
    def get_hpo_from_cache():
        results = None
        try:
            file = open("ontology_data/hp.json", "r")
            results = json.load(file)
        except IOError as io:
            sys.exit(
                F"IO error retrieving cached HPO terms: {io.errno} -> {io.strerror}")
        except BaseException as ex:
            sys.exit(
                F"An unexpected error occurred whilst retrieving cached HPO terms: {ex}")
        return results

    @staticmethod
    def set_hpo_synonyms():
        ont = owlready2.get_ontology(config.hpo_file)
        ont.load()
        g = owlready2.default_world.as_rdflib_graph()
        hpo_ontology_syns = g.query(
            config.hpo_syns_statement, initNs=HPO.hp_namespaces)
        g.close()
        results = [[id, synonym.toPython().lower()]
                   for (id, synonym) in hpo_ontology_syns]
        output = json.dumps(results)
        file = open("ontology_data/hp_syns.json", "w")
        file.write(output)
        file.close()
        return results

    @staticmethod
    def get_syns():
        file = open("ontology_data/hp_syns.json", "r")
        results = json.load(file)
        return results

    @staticmethod
    def get_hpo_2_mesh(cursor):
        hpo_to_mesh = {"hpoID": [], "meshID": []}
        for (hpoID, meshID) in cursor:
            hpo_to_mesh["hpoID"].append(hpoID)
            hpo_to_mesh["meshID"].append(meshID)
        cursor.close()
        return hpo_to_mesh


class MP:
    hp_namespaces = {"owl": rdflib.namespace.OWL,
                     "rdf": rdflib.namespace.RDF, "rdfs": rdflib.namespace.RDFS}

    sparql_query = """
    PREFIX owl:  <http://www.w3.org/2002/07/owl#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

    SELECT DISTINCT ?root ?label ?syn ?super
    WHERE {
    ?root a owl:Class .
    ?root rdfs:label ?label .
    OPTIONAL {
    ?root <http://www.geneontology.org/formats/oboInOwl#hasExactSynonym> ?syn .
        }
    OPTIONAL {
        ?root rdfs:subClassOf ?super
    }
    }

        """

    @staticmethod
    def update_terms():
        results = {"name": "Mammalian Phenotype Ontology", "children": []}
        try:
            directory = pathlib.Path().absolute()
            owlready2.onto_path.append(directory)
            print(F"{directory}\ontology_data\mp.owl")
            ont = owlready2.get_ontology(F"{directory}\ontology_data\mp.owl")

            ont.load()
            g = owlready2.default_world.as_rdflib_graph()
            hpo_ontology_terms = g.query(
                MP.sparql_query, initNs=MP.hp_namespaces)
            g.close()
            for (id, label, syn, parent) in hpo_ontology_terms:
                termID = id.toPython()[id.toPython().rfind("/") + 1:]
                isSynonymRecord = False
                for entry in results["children"]:
                    if entry.ont_id == termID:
                        if syn:
                            if syn.toPython() not in entry.synonyms:
                                entry.synonyms.append(syn.toPython())
                        isSynonymRecord = True
                        break
                if isSynonymRecord:
                    continue
                if parent:
                    parent = parent.toPython(
                    )[parent.toPython().rfind("/") + 1:]
                node = Node(label.toPython(), termID, parent=parent)
                if syn:
                    node.synonyms.append(syn.toPython())
                results["children"].append(node)
            results["children"] = [x.__dict__ for x in results["children"]]
            output = json.dumps(results)
            file = open(F"{directory}\ontology_cache\mp.json", "w")
            file.write(output)
            file.close()
        except IOError as io:
            sys.exit(
                F"IO error storing new MP terms: {io.errno} -> {io.strerror}")
        except BaseException as ex:
            sys.exit(
                F"An unexpected error occurred whilst storing new MP terms: {ex}")
        return results
