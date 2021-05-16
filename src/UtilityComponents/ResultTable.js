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
import {TablePagination} from "@material-ui/core";

class ResultTable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {tableData: {}, onRowClick: null, rowsPerPage:5, page:0};
    }

    handleChangePage = (event, newPage) => {
        this.setState({page: newPage});
    }

    handleChangeRowsPerPage = (event) => {
        this.setState({rowsPerPage: parseInt(event.target.value, 10), page: 0});
    }

    render() {
        if (typeof this.props.tableData != "undefined" && this.props.tableData !== null)
            if (this.props.tableData.length > 0) {
                return (<div className="container">
                        <TableContainer component={Paper} className="info" id="searchResults">
                            <Table size="small" aria-label="a dense table">
                                <TableHead>
                                    <TableRow>
                                        {Object.keys(this.props.tableData[0]).map((header, index) => {
                                            return (<TableCell align="center" key={index}>{header}</TableCell>)
                                        })}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {this.props.tableData.slice(this.state.page * this.state.rowsPerPage,
                                        this.state.page * this.state.rowsPerPage + this.state.rowsPerPage).map((row, index) => {
                                            if (this.props.isSearchResult)
                                                return (
                                                    <TableRow data-human-ont={row["Human Ontology"]} data-human-term={row["ID"]} data-mouse-term={row["MP ID"]} key={index} onClick={this.props.onRowClick}>
                                                        {Object.keys(row).map((key) => {
                                                            return (<TableCell align="left" data-human-ont={row["Human Ontology"]} data-human-term={row["ID"]} data-mouse-term={row["MP ID"]}>{row[key]}</TableCell>)
                                                        })}
                                                    </TableRow>)
                                            else
                                                return (
                                                    <TableRow data-study={row["ID"]} key={index} onClick={this.props.onRowClick}>
                                                        {Object.keys(row).map((key) => {
                                                            return (<TableCell align="left" data-study={row["ID"]}>{row[key]}</TableCell>)
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