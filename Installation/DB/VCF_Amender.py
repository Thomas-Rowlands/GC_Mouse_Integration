import subprocess
import urllib.parse

import vcf  # PyVCF3
import mysql.connector
from gffutils.iterators import DataIterator
from vcf.model import _Record
from py2neo import Graph

db_connection = mysql.connector.connect(host="localhost", database="GC_browser", user="root",
                                        password="Maggie7803GB!")
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
        self.LINKS = None
        self.remove_unwanted_attributes()
        self.INFO["GWAS Central"] = F"<a class='jbrowse-feature-btn' href='https://www.gwascentral.org/markers?q={self.ID}'>{self.ID}</a>;"
        self.INFO["dbSNP"] = F"<a class='jbrowse-feature-btn' href='https://www.ncbi.nlm.nih.gov/snp/{self.ID}'>{self.ID}</a>;"
        self.INFO["Associated Phenotypes"] = None
        self.get_variant_phenotypes()

    def remove_unwanted_attributes(self):
        self.FILTER, self.FORMAT, self.INFO = None, None, {}

    def get_variant_phenotypes(self):
        cmd = F"""
            SELECT DISTINCT pa.PhenotypeIdentifier
            FROM GC_marker.Marker AS m
            INNER JOIN GC_study.Usedmarkerset AS ums ON ums.MarkerIdentifier = m.Identifier
            INNER JOIN GC_study.Experiment AS e ON e.ExperimentID = ums.ExperimentID
            INNER JOIN GC_study.PhenotypeMethod AS pm ON pm.StudyID = e.StudyID
            INNER JOIN GC_study.PPPA AS pppa ON pppa.PhenotypePropertyID = pm.PhenotypePropertyID
            INNER JOIN GC_study.PhenotypeAnnotation As pa ON pa.PhenotypeAnnotationID = pppa.PhenotypeAnnotationID
            WHERE m.Accession = "{self.ID}" AND pa.AnnotationOrigin in ('mesh', 'hpo');
        """
        results = db.execute(cmd, multi=True)
        for result in results:
            if result.with_rows:
                phenotypes = self.get_phenotype_names([x for [(x)] in result.fetchall()])
                phenotypes_string = ""
                for phenotype in phenotypes:
                    phenotypes_string += F"<a class='jbrowse-feature-btn' href=\"https://www.gwascentral.org/phenotypes/term?q={urllib.parse.quote(phenotype)}\" target='_blank'>{urllib.parse.quote(phenotype)}</a></br>, "
                self.INFO["Associated Phenotypes"] = phenotypes_string[:-2]

    @staticmethod
    def get_phenotype_names(descriptors):
        phenotype_names = []
        for descriptor in descriptors:
            if "HP:" in descriptor:
                result = neo_db.run(F"MATCH (n:HPO) USING INDEX n:HPO(id) WHERE n.id = '{descriptor}' RETURN n.FSN AS name LIMIT 1")
            else:
                result = neo_db.run(F"MATCH (n:MESH) USING INDEX n:MESH(id) WHERE n.id = '{descriptor}' RETURN n.FSN AS name LIMIT 1")
            phenotype_names.append(result.data("name")[0]["name"])
        return phenotype_names


class VCFLink:
    def __init__(self):
        self.name = "pleb"
        self.url = "pleb_with_a_url"

    def get_formatted_data(self):
        return_string = ""
        for key in self.__dict__:
            return_string += F"{key}={self.__dict__[key]};"
        return return_string


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


def update_gc_data():
    vcf_in = vcf.Reader(filename='../../api/JBrowseData/GC_only_variants.vcf')
    vcf_out = vcf.Writer(open('../../api/JBrowseData/GC_only_variants_testing.vcf', 'w'), vcf_in)
    i = 0
    for rec in vcf_in:
        i += 1
        if i == 5:
            break
        new_variant = GCVariant(rec.CHROM, rec.POS, rec.ID, rec.REF, rec.ALT, rec.QUAL, rec.FILTER, rec.INFO,
                                rec.FORMAT, None)
        try:
            vcf_out.write_record(new_variant)
        except Exception as e:
            print(e)
    vcf_out.close()
    subprocess.run("bgzip -c ../../api/JBrowseData/GC_only_variants_testing.vcf > "
                   "../../api/JBrowseData/GC_only_variants_testing.vcf.gz", shell=True, check=True)
    subprocess.run("tabix -p vcf ../../api/JBrowseData/GC_only_variants_testing.vcf.gz", shell=True, check=True)


# filter_ensemble_variants()
# filter_ensemble_genes()
update_gc_data()
