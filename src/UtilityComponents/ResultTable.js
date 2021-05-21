import React, {useCallback} from 'react';
import './ResultTable.css';
import $ from 'jquery';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import {TablePagination, TableSortLabel} from "@material-ui/core";

class ResultTable extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            tableData: {},
            onRowClick: null,
            rowsPerPage: 5,
            page: 0,
            order: "asc",
            orderBy: "Gene"
        };
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

    render() {
        const paddingHeaders = ["Gene", "Procedure Parameter", "Sex"];

        if (typeof this.props.tableData != "undefined" && this.props.tableData !== null)
            if (this.props.tableData.length > 0) {
                return (<div className="container">
                        <TableContainer component={Paper} className="info" id="searchResults">
                            <Table size="small" aria-label="a dense table">
                                <TableHead>
                                    <TableRow>
                                        {Object.keys(this.props.tableData[0]).map((header, index) => {
                                            return (<TableCell align={"right"} padding={paddingHeaders.includes(header) ? "none" : "default"}
                                                               sortDirection={this.state.orderBy === header ? this.state.order : false} key={index}
                                                               onClick={() => this.handleRequestSort(header)}>{header}
                                                <TableSortLabel active={this.state.orderBy === header}
                                                                direction={this.state.orderBy === header ? this.state.order : "asc"}
                                                                onClick={() => this.handleRequestSort(header)}>
                                                </TableSortLabel>
                                            </TableCell>)
                                        })}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {this.stableSort(this.props.tableData, this.getComparator(this.state.order, this.state.orderBy)).slice(this.state.page * this.state.rowsPerPage,
                                        this.state.page * this.state.rowsPerPage + this.state.rowsPerPage).map((row, index) => {
                                        if (this.props.isSearchResult)
                                            return (
                                                <TableRow data-human-ont={row["Human Ontology"]}
                                                          data-human-term={row["ID"]} data-mouse-term={row["MP ID"]}
                                                          key={index} onClick={this.props.onRowClick}>
                                                    {Object.keys(row).map((key) => {
                                                        return (<TableCell align="left"
                                                                           data-human-ont={row["Human Ontology"]}
                                                                           data-human-term={row["ID"]}
                                                                           data-mouse-term={row["MP ID"]}>{row[key]}</TableCell>)
                                                    })}
                                                </TableRow>)
                                        else
                                            return (
                                                <TableRow data-study={row["ID"]} key={index}
                                                          onClick={this.props.onRowClick}>
                                                    {Object.keys(row).map((key) => {
                                                        return (<TableCell align="left"
                                                                           data-study={row["ID"]}>{row[key]}</TableCell>)
                                                    })}
                                                </TableRow>
                                            )
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25]}
                            component="div"
                            count={this.props.tableData.length}
                            rowsPerPage={this.state.rowsPerPage}
                            page={this.state.page}
                            onChangePage={this.handleChangePage}
                            onChangeRowsPerPage={this.handleChangeRowsPerPage}
                        />
                    </div>
                );
            } else {
                return (
                    <span className="center">No results found.</span>
                );
            }
        else
            return null;

    }
}


export default ResultTable;