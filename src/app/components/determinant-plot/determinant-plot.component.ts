import { Component, ViewChild } from '@angular/core';
import * as Plotly from 'plotly.js';
import { PlotComponent, PlotlyService } from 'angular-plotly.js';
import { math } from '../../math/custom-math';

@Component({
  selector: 'app-determinant-plot',
  templateUrl: './determinant-plot.component.html',
  styleUrls: ['./determinant-plot.component.scss']
})
export class DeterminantPlotComponent {

  @ViewChild(PlotComponent) plotlyRef: PlotComponent;

  graphData: Plotly.Data = {
    line: {
      color: '#f44336',
      // width: 1,
      width: 2
    },
    type: 'scatter',
    x: [],
    y: []
  };
  graphLayout: Partial<Plotly.Layout> = {
    // width: 320,
    font: {
      family: '"Courier New", monospace',
      color: '#fff'
    },
    margin: {
      t: 20,
      r: 20,
      b: 40,
      l: 42
    },
    xaxis: {
      color: '#fff',
      zerolinewidth: 2,
      // showgrid: false,
      range: [0, math.pi * 2],
      dtick: 1
    },
    yaxis: {
      color: '#fff',
      zerolinewidth: 2,
      // showgrid: false,
      range: [-9, 9],
      ticklen: 5,
      dtick: 2
    },
    autosize: true,
    height: 480,
    paper_bgcolor: '#303030',
    plot_bgcolor: '#303030'
  };
  graphConfig: Partial<Plotly.Config> = {
    staticPlot: true
  };

  constructor(
    private plotly: PlotlyService
  ) { }

  reset() {
    this.graphData.x = [];
    this.graphData.y = [];
  }

  push(xValues: number[], yValues: number[]) {
    const plotly = this.plotly.getPlotly();
    const plotlyRoot = this.plotlyRef.plotEl.nativeElement;
    plotly.extendTraces(plotlyRoot, { x: [xValues], y: [yValues] }, [0]);
  }
}
