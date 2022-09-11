import vcf  # PyVCF3
import mysql.connector
from gffutils.iterators import DataIterator
from vcf.model import _Record
from py2neo import Graph

db_connection = mysql.connector.connect(host="localhost", database="GC_browser", user="root",
                                        password="GTX7807803GB!")
db = db_connection.cursor()
neo_db = Graph("bolt://localhost:7687", auth=("neo4j", "12345"))

class IMPCGene:
    def __init__(self):
        name = ""
        description = ""
        position = ""
        length = ""
        type = ""
        links = []
        phenotypes = []


class GCVariant(_Record):
    def __init__(self, CHROM, POS, ID, REF, ALT, QUAL, FILTER, INFO, FORMAT, sample_indexes):
        super().__init__(CHROM, POS, ID, REF, ALT, QUAL, FILTER, INFO, FORMAT, sample_indexes)
        self.phenotypes = []
        self.get_variant_phenotypes()

    def get_variant_phenotypes(self):
        cmd = F"""
            SELECT DISTINCT pa.PhenotypeIdentifier
            FROM GC_marker.marker AS m
            INNER JOIN GC_study.usedmarkerset AS ums ON ums.MarkerIdentifier = m.Identifier
            INNER JOIN GC_study.experiment AS e ON e.ExperimentID = ums.ExperimentID
            INNER JOIN GC_study.PhenotypeMethod AS pm ON pm.StudyID = e.StudyID
            INNER JOIN GC_study.pppa AS pppa ON pppa.PhenotypePropertyID = pm.PhenotypePropertyID
            INNER JOIN GC_study.PhenotypeAnnotation As pa ON pa.PhenotypeAnnotationID = pppa.PhenotypeAnnotationID
            WHERE m.Accession = "{self.ID}";
        """
        results = db.execute(cmd, multi=True)
        for result in results:
            if result.with_rows:
                self.phenotypes = self.get_phenotype_names([x for [(x)] in result.fetchall()])

    @staticmethod
    def get_phenotype_names(descriptors):
        phenotype_names = []
        for descriptor in descriptors:
            result = neo_db.run(F"MATCH (n:MESH) WHERE n.id = '{descriptor}' RETURN n.FSN AS name LIMIT 1")
            phenotype_names.append(result.data("name")[0]["name"])
        return phenotype_names


class VCFLink:
    def __init__(self):
        name = ""
        url = ""


def get_variant_list():
    marker_list = []
    chroms = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11",
              "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "X", "Y"]
    for chrom in chroms:
        cmd = F"""
        SELECT DISTINCT ms.Marker_Accession 
            FROM GC_browser.marker_significances_chr{chrom} AS ms
            INNER JOIN all_markers AS am ON am.Accession = ms.Marker_Accession
            WHERE ms.SignificanceList0 != "" AND am.Status = "active";
        """
        results = db.execute(cmd, multi=True)
        for result in results:
            if result.with_rows:
                marker_list.extend([x for [(x)] in result.fetchall()])

    return marker_list


def get_gene_list(gene_list):
    cmd = F"""
        SELECT DISTINCT gc_mouse.mg.gene_symbol
            FROM gc_mouse.experiments AS ex
            INNER JOIN gc_mouse.mouse_markers AS mm ON mm.mouse_marker_id = ex.mouse_marker_id
            INNER JOIN gc_mouse.mouse_genes AS mg ON mg.id = mm.mouse_gene_id;
    """
    results = db.execute(cmd, multi=True)
    for result in results:
        if result.with_rows:
            gene_list = [x for [(x)] in result.fetchall()]

    return gene_list


def filter_ensemble_variants():
    vcf_in = vcf.Reader(filename='../../api/JBrowseData/homo_sapiens_phenotype_associated.vcf')
    vcf_out = vcf.Writer(open('../../api/JBrowseData/GC_only_variants.vcf', 'w'), vcf_in)
    marker_list = get_variant_list()
    for rec in vcf_in:
        if rec.ID in marker_list:
            new_variant = GCVariant(rec.CHROM, rec.POS, rec.ID, rec.REF, rec.ALT, rec.QUAL, rec.FILTER, rec.INFO,
                                    rec.FORMAT, None)
            try:
                vcf_out.write_record(new_variant)
            except:
                print("pleb")


def filter_ensemble_genes():
    gff_in = "../api/JBrowseData/Homo_sapiens.GRCh37.87.chr_sorted.gff3"
    gff_out = "../api/JBrowseData/IMPC_Genes.gff3"
    gene_list = get_gene_list([])
    with open(gff_out, "w") as fout:
        for feature in DataIterator(gff_in):
            if feature.featuretype != "gene":
                continue
            gene_names = []
            try:
                gene_names = feature.attributes._d["Name"]
            except KeyError as ke:
                continue
            except:
                raise
            for gene in gene_list:
                for name in gene_names:
                    if gene.lower() == name.lower():
                        fout.write(str(feature) + "\n")


filter_ensemble_variants()
# filter_ensemble_genes()
