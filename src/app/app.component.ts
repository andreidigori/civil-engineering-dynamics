import { Component, ViewChildren, QueryList, ElementRef, ViewChild, OnInit } from '@angular/core';
import { FormBuilder, ValidationErrors, AbstractControl } from '@angular/forms';
import { interval, Subscription, animationFrameScheduler } from 'rxjs';
import { takeWhile, finalize } from 'rxjs/operators';
import { KatexOptions } from 'ng-katex';
import * as math from 'mathjs';
import { ChartDataSets, ChartOptions, ChartPoint } from 'chart.js';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  @ViewChildren('coefficientInput') coefficientInputs!: QueryList<ElementRef<HTMLInputElement>>;

  inputForm = this.fb.group({
    coefficients: this.fb.group({
      11: [null, this.validateMathInput],
      12: [null, this.validateMathInput],
      13: [null, this.validateMathInput],
      22: [null, this.validateMathInput],
      23: [null, this.validateMathInput],
      33: [null, this.validateMathInput]
    }),
    size: null,
    approximation: 2,
    fullgraph: true
  });
  katexOptions: KatexOptions = {
    displayMode: true
  };
  graphData: ChartDataSets = {
    data: [],
    borderColor: '#f44336',
    borderWidth: 1
  };
  graphOptions: ChartOptions = {
    // width: 320,
    /* font: {
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
    plot_bgcolor: '#303030' */
  };
  /* graphConfig: Partial<Plotly.Config> = {
    staticPlot: true
  }; */
  result: number;

  private lastCoefficientsTex: { [index: string]: string } = {};
  private calculation: Subscription;
  private lastDeterminant: number;

  get isCalculating() {
    return !!this.calculation && !this.calculation.closed;
  }

  constructor(
    private fb: FormBuilder
  ) {
    const functions: math.ImportObject = {
      phi1: (v: number) => math.evaluate('v ^ 2 * tan(v) / 3 / (tan(v) - v)', { v }),
      phi2: (v: number) => math.evaluate('v * (tan(v) - v) / 8 / tan(v) / (tan(v / 2) - v / 2)', { v }),
      phi3: (v: number) => math.evaluate('v * (v - sin(v)) / 4 / sin(v) / (tan(v / 2) - v / 2)', { v }),
      phi4: (v: number) => math.evaluate('v ^ 2 * tan(v / 2) / 12 / (tan(v / 2) - v / 2)', { v }),
      eta1: (v: number) => math.evaluate('v ^ 3 / 3 / (tan(v) - v)', { v }),
      eta2: (v: number) => math.evaluate('v ^ 3 / 24 / (tan(v / 2) - v / 2)', { v })
    };
    math.import(functions, null);
  }

  ngOnInit() {
    this.loadInput();
  }

  getCoefficients(size: number) {
    switch (size) {
      case 1: {
        return ['11'];
      }
      case 2: {
        return ['11', '12', '22'];
      }
      case 3: {
        return ['11', '12', '13', '22', '23', '33'];
      }
    }
    return [];
  }

  getCoefficientTex(index: string) {
    try {
      const value = this.getCoefficient(index);
      const node = math.parse(value);
      const formatted = node.toTex().replace(/(phi|eta)(\d)/g, '\\$1_$2');
      this.lastCoefficientsTex[index] = formatted;
    } catch (e) {

    }
    return 'r_{' + index + '} = ' + this.lastCoefficientsTex[index];
  }

  getResultTex() {
    if (!this.result) {
      return '...';
    }
    const approximation = this.inputForm.get('approximation').value as number;
    return this.result.toFixed(approximation);
  }

  getDeterminantTex() {
    if (!this.result) {
      return '...';
    }
    return this.calculateDeterminant(this.result).toFixed(4);
  }

  insert(index: string, text: string) {
    const size = this.inputForm.get('size').value as number;
    const coefficients = this.getCoefficients(size);
    const inputIndex = coefficients.indexOf(index);
    const input = this.coefficientInputs.find((_, i) => inputIndex === i).nativeElement;
    const scrollTop = input.scrollTop;
    const position = input.selectionStart;
    const before = input.value.substring(0, position);
    const after = input.value.substring(position, input.value.length);
    const value = before + text + after;
    input.value = value;
    const newPosition = position + text.length;
    input.selectionStart = newPosition;
    input.selectionEnd = newPosition;
    input.focus();
    input.scrollTop = scrollTop;
    this.inputForm.get(['coefficients', index]).setValue(value);
  }

  back() {
    history.back();
  }

  clear() {
    this.lastDeterminant = 0;
    this.result = 0;
    this.graphData.data = [];
  }

  stopCalculation() {
    this.calculation.unsubscribe();
    this.inputForm.enable();
  }

  calculate() {
    // clear before all
    this.clear();

    // save input values
    this.saveInput();

    // disable inputs
    this.inputForm.disable();

    // calculate
    const approximation = this.inputForm.get('approximation').value as number;
    const fullgraph = this.inputForm.get('fullgraph').value as boolean;
    const step = math.pow(10, -approximation) as number;
    // const stepsCount = 6;
    let v = step;
    const interval$ = interval(0, animationFrameScheduler).pipe(
      takeWhile(_ => v < math.pi * 2),
      finalize(() => this.stopCalculation())
    );
    this.calculation = interval$.subscribe(_ => {
      const values = [] as ChartPoint[];
      const limit = math.min(v + 0.1/*step * stepsCount*/, math.pi * 2) as number;
      for (; v < limit; v += step) {
        const determinant = this.calculateDeterminant(v);
        if (!this.result) {
          // function graph intersected X axis
          if (this.lastDeterminant * determinant < 0) {
            // when function graph is far ahead of X axis
            this.result = math.abs(this.lastDeterminant) < math.abs(determinant) ? v - step : v;

            if (!fullgraph) {
              this.stopCalculation();
            }
          }
          this.lastDeterminant = determinant;
        }
        values.push({
          x: v,
          y: determinant
        });
      }
      const data = this.graphData.data as ChartPoint[];
      data.push(...values);
    });
  }

  private loadInput() {
    try {
      const value = localStorage.getItem('lastInput');
      const data = JSON.parse(value);
      this.inputForm.patchValue(data);
    } catch (e) {

    }
  }

  private saveInput() {
    const value = JSON.stringify(this.inputForm.value);
    localStorage.setItem('lastInput', value);
  }

  private validateMathInput(control: AbstractControl): ValidationErrors | null {
    try {
      const value = control.value || '0';
      math.evaluate(value, { v: 0.1 });
      return null;
    } catch (e) {
console.log('fuck', e, math)
    }
    return {
      math: control.value
    };
  }

  private getCoefficient(index: string) {
    return this.inputForm.get(['coefficients', index]).value || '0';
  }

  private calculateDeterminant(v: number) {
    const size = this.inputForm.get('size').value as number;
    switch (size) {
      case 1: {
        const r11 = this.calculateCoefficient(v, '11');
        return r11;
      }
      case 2: {
        const r11 = this.calculateCoefficient(v, '11');
        const r12 = this.calculateCoefficient(v, '12');
        const r22 = this.calculateCoefficient(v, '22');
        return r11 * r22 - r12 * r12;
      }
      case 3: {
        const r11 = this.calculateCoefficient(v, '11');
        const r12 = this.calculateCoefficient(v, '12');
        const r13 = this.calculateCoefficient(v, '13');
        const r22 = this.calculateCoefficient(v, '22');
        const r23 = this.calculateCoefficient(v, '23');
        const r33 = this.calculateCoefficient(v, '33');
        return r11 * r22 * r33 + r12 * r23 * r13 + r13 * r12 * r23 - r13 * r22 * r13 - r12 * r12 * r33 - r11 * r23 * r23;
      }
    }
    return 0;
  }

  private calculateCoefficient(v: number, index: string) {
    return math.evaluate(this.getCoefficient(index), { v });
  }
}
