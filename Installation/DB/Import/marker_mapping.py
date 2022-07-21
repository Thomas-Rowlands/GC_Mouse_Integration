import DB
import config
from gtfparse import read_gtf
from bs4 import BeautifulSoup

class MarkerMapper:
    con = None
    cursor = None

    @staticmethod
    def start():
        global con, cursor
        con = DB.Connection(config.host, config.mouse_db, config.username, config.password)
        cursor = con.cursor
        markers = MarkerMapper.__get_markers()
        genes = MarkerMapper.__get_genes_for_markers(markers)


    @staticmethod
    def __get_genes_for_markers(markers):
        gene_df = read_gtf("../mouse_import/Homo_sapiens.GRCh38.102.chr.gtf")
        print("stop")

    @staticmethod
    def __get_markers():
        markers = []
        global cursor
        cursor.callproc("get_unlinked_human_markers", [10])
        for result in cursor.stored_results():
            markers = result.fetchall()
        return markers

    # @staticmethod
    # def __link_markers():
