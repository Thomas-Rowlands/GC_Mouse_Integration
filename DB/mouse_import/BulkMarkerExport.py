from pyliftover import LiftOver

import DB
import config
import json

from marker_mapping import MarkerMapper


def get_markers(limit, offset):
    con = DB.Connection(config.host, config.mouse_db, config.username, config.password)
    cursor = con.cursor
    markers = []
    lifter = LiftOver("hg19", "hg38")
    cursor.callproc("get_unlinked_human_markers", args=(limit, offset))
    for result in cursor.stored_results():
        markers = [(a, b, c, MarkerMapper.index_check(lifter.convert_coordinate(F"chr{c}", d)),
                    MarkerMapper.index_check(lifter.convert_coordinate(F"chr{c}", e))) for (a, b, c, d, e) in
                   result.fetchall()]
    return [x for x in markers if x[3] is not None and x[4] is not None]


def export_all_unlinked_markers(limit):
    markers = get_markers(1000000, 0)
    i = 1
    while len(markers):
        with open(F"MarkerDump/markers{i}.json", "w", encoding="utf-8") as fout:
            json.dump(markers, fout)
        markers = get_markers(1000000, i * 1000000)
        i += 1
    print("Done!")
