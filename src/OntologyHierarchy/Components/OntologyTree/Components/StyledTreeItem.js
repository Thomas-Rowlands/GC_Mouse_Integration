import React from 'react';
import Typography from '@material-ui/core/Typography';
import {withStyles} from '@material-ui/core';
import TreeItem from '@material-ui/lab/TreeItem';

const useTreeItemStyles = theme => ({
  root: {
    color: theme.palette.text.secondary,
      fontFamily: "Roboto, Trebuchet MS, serif",
    '&:hover > $content': {
      // backgroundColor: theme.palette.action.hover,
    },
    '&:focus > $content, &$selected > $content': {
      // backgroundColor: `var(--tree-view-bg-color, ${theme.palette.grey[400]})`,
      color: 'var(--tree-view-color)',
    },
    '&:focus > $content $label, &:hover > $content $label, &$selected > $content $label': {
      // backgroundColor: theme.palette.action.hover,
    },
  },
  content: {
    color: theme.palette.text.secondary,
    borderTopRightRadius: theme.spacing(2),
    borderBottomRightRadius: theme.spacing(2),
    paddingRight: theme.spacing(1),
    fontWeight: theme.typography.fontWeightRegular,
    '$expanded > &': {
      fontWeight: theme.typography.fontWeightRegular,
    },
  },
  group: {
    '& $content': {
      // paddingLeft: theme.spacing(2),
    },
  },
  expanded: {},
  selected: {},
  label: {
    fontWeight: 'inherit',
    color: 'inherit',
      textAlign: 'left',
      wordWrap: "normal"
  },
});

class StyledTreeItem extends React.Component {
    constructor(props) {
        super(props);
        this.state = {label: "", color: "", bgColor: "",};
    }



    render() {
        const {classes, labelInfo, labelText, nodeId, labelIcon, color, bgColor,key,hasChildren, ...other} = this.props;

        return (
            <TreeItem
                label={
                    <div className={classes.label} data-has-children={hasChildren}>
                        <Typography variant="body2" className={classes.content} component="span">
                            {labelText}
                        </Typography>
                        <Typography variant="caption" color="inherit">
                            {labelInfo}
                        </Typography>
                        <div className={classes.labelIcon} style={{float: 'right'}}>
                            {labelIcon}
                        </div>
                    </div>
                }
                style={{
                    '--tree-view-color': color,
                    '--tree-view-bg-color': bgColor,
                }}
                key={key}
             nodeId={nodeId}
            classes={{
        root: classes.root,
        content: classes.content,
        expanded: classes.expanded,
        selected: classes.selected,
        group: classes.group,
        label: classes.label,
            }}
                {...other}
            />
        );
    }
}
export default withStyles(useTreeItemStyles)(StyledTreeItem);

