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

class ResultTable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {tableData: {}, onRowClick: null};
    }

    getPageControls(dataLength) {
        if (dataLength > 0) {
            return (
                <div className="row">
                    <div className="col">
                        <a className="table-prev btn btn-link disabled" id="prev_page_btn">&lt;- Previous Page</a>
                    </div>
                    <div className="col">
                        <span className="page-counter" id="pageNum">Page 1</span>
                    </div>
                    <div className="col">
                        <a className="table-next btn btn-link disabled" id="next_page_btn">Next Page -&gt;</a>
                    </div>
                </div>
            );
        }
    }


    render() {
        if (typeof this.props.tableData != "undefined" && this.props.tableData !== null)
            if (this.props.tableData.length > 0) {
                return (<div className="container">
                        {this.getPageControls(this.props.tableData.length)}
                        <br/>
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
                                    {this.props.tableData.map((row, index) => {
                                        return (
                                            <TableRow data-id={row["ID"]} key={index} onClick={this.props.onRowClick}>
                                                {Object.keys(row).map((key) => {
                                                    return (<TableCell align="left"
                                                                       data-id={row["MP ID"]}>{row[key]}</TableCell>)
                                                })}
                                            </TableRow>)
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </div>
                );
            } else {
                return (
                    <div>
                        <br/>
                        <br/>
                        <p className="center">No results found.</p>
                    </div>
                );
            }
        else
            return null;

    }
}


export default ResultTable;