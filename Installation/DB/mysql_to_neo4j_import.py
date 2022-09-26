from py2neo import Graph
from mysql import connector
import sys


def mysql_connection():
    new_con = None
    try:
        new_con = connector.connect(host="localhost", database="GC_study", user="root", password="Maggie7803GB!")
    except Exception as ex:
        sys.exit(ex)
    return new_con


def neo4j_connection():
    new_con = None
    try:
        new_con = Graph(scheme="bolt", host="localhost", password="12345")
    except Exception as ex:
        sys.exit(ex)
    return new_con


def import_pipelines():
    pass


def import_procedures():
    pass


def import_genes():
    pass


def import_cohorts():
    pass


def main():
    pass


if __name__ == "__main__":
    main()
