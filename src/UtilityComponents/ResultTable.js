import React, {useCallback} from 'react';
import './ResultTable.css';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import {IconButton, TablePagination, TableSortLabel, Tooltip} from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import SearchIcon from "@material-ui/icons/Search";
import {Equalizer} from "@material-ui/icons";

class ResultTable extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            tableData: {},
            onRowClick: null,
            onCellClick: null,
            rowsPerPage: 10,
            page: 0,
            order: this.props.order ? this.props.order : "asc",
            orderBy: this.props.orderBy ? this.props.orderBy : "Gene",
            cellClickHandlers: null,
            hiddenHeaders: null,
            hoverDataMap: null,
            dataHeaders: null,
        }
    }

    handleChangePage = (event, newPage) => {
        this.setState({page: newPage});
    }

    handleChangeRowsPerPage = (event) => {
        this.setState({rowsPerPage: parseInt(event.target.value, 10), page: 0});
    }

    handleRequestSort = (property) => {
        const isAsc = this.state.orderBy === property && this.state.order === 'asc';
        this.setState({order: isAsc ? 'desc' : 'asc', orderBy: property});
    }

    descendingComparator = (a, b, orderBy) => {
        if (!isNaN(a[orderBy])) { // numeric values must be converted from a string first.
            if (+b[orderBy] < +a[orderBy]) {
                return -1;
            }
            if (+b[orderBy] > +a[orderBy]) {
                return 1;
            }
        } else {
            if (b[orderBy] < a[orderBy]) {
                return -1;
            }
            if (b[orderBy] > a[orderBy]) {
                return 1;
            }
        }

        return 0;
    }

    getComparator = (order, orderBy) => {
        return order === 'desc'
            ? (a, b) => this.descendingComparator(a, b, orderBy)
            : (a, b) => -this.descendingComparator(a, b, orderBy);
    }

    stableSort = (array, comparator) => {
        const stabilizedThis = array.map((el, index) => [el, index]);
        stabilizedThis.sort((a, b) => {
            const order = comparator(a[0], b[0]);
            if (order !== 0) return order;
            return a[1] - b[1];
        });
        return stabilizedThis.map((el) => el[0]);
    }

    viewButtonHeader = () => {
        if (this.props.isSearchResult) {
            return (
                <TableCell align="center" padding="normal"/>
            );
        } else
            return null;
    }

    getCellClickHandler = (header) => {
        if (this.props.cellClickHandlers) {
            return this.props.cellClickHandlers[header];
        }
    }

    getTableCell = (row, key) => {
        let clickFunc = this.getCellClickHandler(key);
        let dataLink = this.props.dataHeaders ? row[this.props.dataHeaders[key]] : null
        if (dataLink)
            return (<TableCell align="center" data-link={dataLink} onClick={clickFunc} data-study={row["ID"]} style={{textDecoration: 'underline blue'}}>{row[key]}</TableCell>);
        else
            return (<TableCell align="center" data-study={row["ID"]} style={{textDecoration: 'none'}}>{row[key]}</TableCell>);
    }

    getCellHoverContent = (row, key) => {
        if (this.props.hoverDataMap[key]) {
            let content = row[this.props.hoverDataMap[key]];
            let tooltipBody = null;
            if (Array.isArray(content)) {
                tooltipBody = (
                    <div>
                        <div style={{textAlign: "center", fontWeight: "bold"}}>{this.props.hoverDataMap[key]}</div> <br />
                    {
                        content.map(syn => {
                            return <div>-{syn}</div>;
                        })
                    }
                    </div>

                );
                content = tooltipBody;
            }
            return content;
        } else
            return null;
    }

    getSearchTableCell = (row, key) => {
        let clickFunc = this.getCellClickHandler(key);
        let hoverText = this.getCellHoverContent(row, key);
        if (hoverText)
            return (
                <Tooltip title={hoverText} arrow>
                    <TableCell align="center"
                               onClick={clickFunc}
                               data-human-ont={row["Human Ontology"]}
                               data-human-term={row["ID"]}
                               data-mouse-term={row["MP ID"]}>{row[key] || row[key] === 0 ? row[key] : "-"}</TableCell>
                </Tooltip>
            );
        else
            return (
                <TableCell align="center"
                           onClick={clickFunc}
                           data-human-ont={row["Human Ontology"]}
                           data-human-term={row["ID"]}
                           data-mouse-term={row["MP ID"]}>{row[key] || row[key] === 0 ? row[key] : "-"}</TableCell>
            );
    }

    render() {
        const paddingHeaders = ["Gene", "Procedure Parameter", "Sex"];
        let hiddenHeaders = this.props.hiddenHeaders || [];
        if (typeof this.props.tableData != "undefined" && this.props.tableData !== null)
            if (this.props.tableData.length > 0 && typeof this.props.tableData === "object") {
                return (<div className="container">
                        <TableContainer component={Paper} className="info" id="searchResults">
                            <Table size="small" aria-label="a dense table">
                                <TableHead>
                                    <TableRow>
                                        {Object.keys(this.props.tableData[0]).map((header, index) => {
                                            if (!hiddenHeaders.includes(header))
                                                return (<TableCell align="center"
                                                                   padding={paddingHeaders.includes(header) ? "none" : "normal"}
                                                                   sortDirection={this.state.orderBy === header ? this.state.order : false}
                                                                   key={index}
                                                                   onClick={() => this.handleRequestSort(header)}>{header}
                                                    <TableSortLabel active={this.state.orderBy === header}
                                                                    direction={this.state.orderBy === header ? this.state.order : "asc"}
                                                                    onClick={() => this.handleRequestSort(header)}>
                                                    </TableSortLabel>
                                                </TableCell>)
                                        })}
                                        {this.props.isSearchResult ? <TableCell align="center" padding="normal">Results</TableCell> : null }
                                        {this.props.isSearchResult ? <TableCell align="center" padding="normal">Genome View</TableCell> : null }

                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {this.stableSort(this.props.tableData, this.getComparator(this.state.order, this.state.orderBy)).slice(this.state.page * this.state.rowsPerPage,
                                        this.state.page * this.state.rowsPerPage + this.state.rowsPerPage).map((row, index) => {
                                        if (this.props.isSearchResult)
                                            return (
                                                <TableRow data-human-ont={row["Human Ontology"]}
                                                          data-human-term={row["ID"]} data-mouse-term={row["MP ID"]}
                                                          key={index}>
                                                    {Object.keys(row).map((key) => {
                                                        if (!hiddenHeaders.includes(key))
                                                            return this.getSearchTableCell(row, key);
                                                    })}<TableCell align="center"><IconButton size="medium" color="primary"
                                                                                         variant="contained"
                                                                                         data-human-ont={row["Human Ontology"]}
                                                                                         data-human-term={row["ID"]}
                                                                                         data-mouse-term={row["MP ID"]}
                                                                                         onClick={() => this.props.viewBtnClicked ? this.props.viewBtnClicked(row["MP ID"], row["ID"], row["Human Ontology"]) : null}>
                                                    <SearchIcon />
                                                </IconButton></TableCell>
                                                    <TableCell align="center"><IconButton size="medium" color="primary"
                                                                                         variant="contained"
                                                                                         data-human-ont={row["Human Ontology"]}
                                                                                         data-human-term={row["ID"]}
                                                                                         data-mouse-term={row["MP ID"]}
                                                                                         onClick={() => this.props.genotypeBtnClicked ? this.props.genotypeBtnClicked(row["ID"], row["Human Ontology"] ? row["Human Ontology"] : "MP") : null}><Equalizer/></IconButton></TableCell>
                                                </TableRow>)
                                        else
                                            return (
                                                <TableRow data-study={row["ID"]} key={index}>
                                                    {Object.keys(row).map((key) => {
                                                        if (!hiddenHeaders.includes(key))
                                                            return this.getTableCell(row, key);
                                                    })}
                                                </TableRow>
                                            )
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            rowsPerPageOptions={[10, 25, 50]}
                            component="div"
                            count={this.props.tableData.length}
                            rowsPerPage={this.state.rowsPerPage}
                            page={this.state.page}
                            onPageChange={this.handleChangePage}
                            onRowsPerPageChange={this.handleChangeRowsPerPage}
                        />
                    </div>
                );
            } else {
                return (
                        <Typography variant="body1" className="center">{this.props.tableData}</Typography>
                );
            }
        else
            return null;

    }
}


export default ResultTable;