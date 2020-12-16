import DB
import config
import requests
import json
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
        markers_string = ",".join([x.replace("rs", "") for x in [z for (y, z) in markers]]).replace(" ","")
        api_query = F"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?fromDb=gene&db=snp&id={markers_string}&rettype=gene_table&retmode=xml"
        result = F"[{requests.post(api_query).text.replace('}{', '},{')}]"
        soup = BeautifulSoup(result, "xml")
        genes = soup.find_all("")
        for i in range(len(markers)):
            id = markers[i][1].replace("rs", "")
            genes = soup.select(F"DocumentSummary[uid='{id}']")
            gene = ""
            if result[i]["refsnp_id"] != id:
                for d in result:
                    if d["refsnp_id"] == id:
                        gene = d["primary_snapshot_data"]["allele_annotations"][""]
        print(result)

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
