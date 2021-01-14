from gtfparse import read_gtf
from pyliftover import LiftOver
from multiprocessing import Manager
from pandas import DataFrame
import numpy
import DB
import config
import time
import mysql

class MarkerMapper:
    def __init__(self, marker_query_limit):
        self.con = DB.Connection(config.host, config.mouse_db, config.username, config.password)
        self.cursor = self.con.cursor
        self.genes = self.__get_gene_list()
        self.lifter = LiftOver("hg19", "hg38")
        self.__markers = []
        self.query_limit = marker_query_limit

    def start(self):
        self.__markers = self.__get_markers(self.query_limit)
        marker_count = len(self.__markers)
        while marker_count > 0:
            links = self.__get_genes_for_markers(self.__markers)
            self.__link_markers(links)
            self.__markers = self.__get_markers(self.query_limit)
            marker_count = len(self.__markers)
        print("Finished successfully.")

    def check_marker(self, gene):
        for x in self.__markers:
            if gene[1] == x[2]:
                if gene[2] <= x[3] <= gene[3]:
                    return {x[1]: [x[3], gene[4]]}
        return None

    def __get_gene_list(self):
        genes = read_gtf("Homo_sapiens.GRCh38.102.chr.gtf",
                         usecols=["feature", "seqname", "start", "end", "gene_name"])
        genes = genes[genes.feature == "gene"]
        chroms = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18',
                  '19', '20', '21', '22', 'X', 'Y', 'MT']
        chrom_genes = {}
        for chrom in chroms:
            chrom_genes[chrom] = genes[(genes["seqname"] == chrom)].values.tolist()
        return chrom_genes

    def __get_genes_for_markers(self, markers):
        marker_genes = {}
        start = time.time()
        for marker in markers:
            marker_genes[marker[1]] = [x for x in self.genes[str(marker[2])] if
                                       x[2] <= marker[3] <= x[3] or x[2] <= marker[4] <= x[3]]
        result = time.time() - start
        return marker_genes

    def __get_markers(self, limit):
        markers = []
        self.cursor.callproc("get_unlinked_human_markers", args=(limit,))
        for result in self.cursor.stored_results():
            markers = [(a, b, c, MarkerMapper.index_check(self.lifter.convert_coordinate(F"chr{c}", d)),
                        MarkerMapper.index_check(self.lifter.convert_coordinate(F"chr{c}", e))) for (a, b, c, d, e) in
                       result.fetchall()]
        return [x for x in markers if x[3] is not None and x[4] is not None]

    @staticmethod
    def index_check(obj):
        if obj:
            return obj[0][1]
        else:
            return None

    def __link_markers(self, links):
        for marker in links.keys():
            if links[marker]:
                try:
                    self.cursor.callproc("insert_lifted_marker", args=(marker, links[marker][0][2], links[marker][0][3]))
                except mysql.connector.errors.IntegrityError as ie:
                    if ie.errno == 1062:
                        pass
                for match in links[marker]:
                    try:
                        self.cursor.callproc("link_human_marker", args=(marker, match[4]))
                    except mysql.connector.errors.IntegrityError as ie:
                        if ie.errno == 1062:
                            pass
            else:
                self.cursor.callproc("link_human_marker", args=(marker, "NA_UNKNOWN"))
