import { Component, ViewChildren, QueryList, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, ValidationErrors, AbstractControl, Validators } from '@angular/forms';
import { interval, Subscription, animationFrameScheduler } from 'rxjs';
import { takeWhile, finalize } from 'rxjs/operators';
import { KatexOptions } from 'ng-katex';
import { math } from './math/custom-math';
import { DeterminantPlotComponent } from './components/determinant-plot/determinant-plot.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  @ViewChildren('coefficientInput') coefficientInputs: QueryList<ElementRef<HTMLInputElement>>;
  @ViewChild(DeterminantPlotComponent) plot: DeterminantPlotComponent;

  inputForm = this.fb.group({
    coefficients: this.fb.group({
      11: [null, this.validateMathInput],
      12: [null, this.validateMathInput],
      13: [null, this.validateMathInput],
      22: [null, this.validateMathInput],
      23: [null, this.validateMathInput],
      33: [null, this.validateMathInput]
    }),
    size: [null, Validators.required],
    approximation: [2, [Validators.required, Validators.min(1), Validators.max(4)]],
    fullgraph: true
  });
  katexOptions: KatexOptions = {
    displayMode: true
  };
  result: number;

  private calculation = Subscription.EMPTY;
  private lastCoefficientsTex: { [index: string]: string } = {};
  private lastDeterminant: number;

  get isCalculating() {
    return !this.calculation.closed;
  }

  get coefficientsNames() {
    const size = this.inputForm.get('size').value as number;
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
  }

  get equationsTex() {
    const size = this.inputForm.get('size').value as number;
    switch (size) {
      case 1: {
        return 'r_{11}';
      }
      case 2: {
        return 'r_{11} & r_{12} \\\\ r_{21} & r_{22}';
      }
      case 3: {
        return 'r_{11} & r_{12} & r_{13} \\\\ r_{21} & r_{22} & r_{23} \\\\ r_{31} & r_{32} & r_{33}';
      }
    }
  }

  get resultTex() {
    const approximation = this.inputForm.get('approximation').value as number;
    return this.result.toFixed(approximation);
  }

  get determinantTex() {
    return this.lastDeterminant.toFixed(4);
  }

  constructor(
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    this.loadInput();
  }

  getCoefficientTex(index: string) {
    try {
      const value = this.getCoefficientExpression(index);
      const node = math.parse(value);
      const formatted = node.toTex().replace(/(phi|eta)(\d)/g, '\\$1_$2');
      this.lastCoefficientsTex[index] = formatted;
    } catch (e) {

    }
    return `r_{${index}} = ${this.lastCoefficientsTex[index]}`;
  }

  insert(index: string, text: string) {
    const inputIndex = this.coefficientsNames.indexOf(index);
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

  clear() {
    this.lastDeterminant = 0;
    this.result = 0;
    this.plot.reset();
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
      const xValues = [] as number[];
      const yValues = [] as number[];
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
        xValues.push(v);
        yValues.push(determinant);
      }
      this.plot.push(xValues, yValues);
    });
  }

  private loadInput() {
    try {
      const value = localStorage.getItem('appMechanics3');
      const data = JSON.parse(value);
      this.inputForm.patchValue(data);
    } catch (e) {

    }
  }

  private saveInput() {
    const value = JSON.stringify(this.inputForm.value);
    localStorage.setItem('appMechanics3', value);
  }

  private getCoefficientExpression(index: string) {
    return this.inputForm.get(['coefficients', index]).value || '0';
  }

  private validateMathInput(control: AbstractControl): ValidationErrors | null {
    try {
      const value = control.value || '0';
      math.evaluate(value, { v: 0.1 });
      return null;
    } catch (e) {

    }
    return {
      math: control.value
    };
  }

  private calculateDeterminant(v: number) {
    const size = this.inputForm.get('size').value as number;
    switch (size) {
      case 1: {
        const r11 = math.evaluate(this.getCoefficientExpression('11'), { v });
        return r11;
      }
      case 2: {
        const r11 = math.evaluate(this.getCoefficientExpression('11'), { v });
        const r12 = math.evaluate(this.getCoefficientExpression('12'), { v });
        const r22 = math.evaluate(this.getCoefficientExpression('22'), { v });
        return r11 * r22 - r12 * r12;
      }
      case 3: {
        const r11 = math.evaluate(this.getCoefficientExpression('11'), { v });
        const r12 = math.evaluate(this.getCoefficientExpression('12'), { v });
        const r13 = math.evaluate(this.getCoefficientExpression('13'), { v });
        const r22 = math.evaluate(this.getCoefficientExpression('22'), { v });
        const r23 = math.evaluate(this.getCoefficientExpression('23'), { v });
        const r33 = math.evaluate(this.getCoefficientExpression('33'), { v });
        return r11 * r22 * r33 + r12 * r23 * r13 + r13 * r12 * r23 - r13 * r22 * r13 - r12 * r12 * r33 - r11 * r23 * r23;
      }
    }
    return 0;
  }
}
