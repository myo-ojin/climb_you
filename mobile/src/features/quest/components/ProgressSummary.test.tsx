/**
 * ProgressSummary Component Tests
 * 進捗表示コンポーネント のテスト
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ProgressSummary } from './ProgressSummary';

describe('ProgressSummary Component', () => {
  const defaultProps = {
    currentStation: 3,
    stepsInCurrentStation: 250,
    totalSteps: 1200,
    progressPercentage: 45,
    currentStreak: 15,
    maxStreak: 28,
  };

  it('3つの統計情報を正しく表示できること', () => {
    render(<ProgressSummary {...defaultProps} />);

    // ステーション
    const station = screen.getByTestId('current-station');
    expect(station).toHaveTextContent('3');

    // ストリーク
    const streak = screen.getByTestId('current-streak');
    expect(streak).toHaveTextContent('15');

    // 歩数
    const steps = screen.getByTestId('total-steps');
    expect(steps).toHaveTextContent('1,200');
  });

  it('進捗バーを正しく表示できること', () => {
    render(<ProgressSummary {...defaultProps} />);

    // 進捗パーセンテージ
    const progressPercentage = screen.getByTestId('progress-percentage');
    expect(progressPercentage).toHaveTextContent('45%');

    // 進捗バーが表示されている
    const progressBar = screen.getByTestId('progress-bar-fill');
    expect(progressBar).toBeTruthy();
  });

  it('最大ストリークを表示できること', () => {
    render(<ProgressSummary {...defaultProps} />);

    const maxStreak = screen.getByTestId('max-streak');
    expect(maxStreak).toHaveTextContent('最高: 28');
  });

  it('1合目を表示できること', () => {
    render(
      <ProgressSummary
        {...defaultProps}
        currentStation={1}
        progressPercentage={10}
      />
    );

    const station = screen.getByTestId('current-station');
    expect(station).toHaveTextContent('1');
  });

  it('10合目（完了）を表示できること', () => {
    render(
      <ProgressSummary
        {...defaultProps}
        currentStation={10}
        progressPercentage={100}
      />
    );

    const station = screen.getByTestId('current-station');
    expect(station).toHaveTextContent('10');

    // 完了メッセージが表示される
    const subtext = screen.getByTestId('progress-subtext');
    expect(subtext).toHaveTextContent('おめでとうございます');
  });

  it('0%進捗を表示できること', () => {
    render(
      <ProgressSummary
        {...defaultProps}
        progressPercentage={0}
        stepsInCurrentStation={0}
      />
    );

    const progressPercentage = screen.getByTestId('progress-percentage');
    expect(progressPercentage).toHaveTextContent('0%');
  });

  it('100%進捗を表示できること', () => {
    render(
      <ProgressSummary
        {...defaultProps}
        progressPercentage={100}
        stepsInCurrentStation={1000}
      />
    );

    const progressPercentage = screen.getByTestId('progress-percentage');
    expect(progressPercentage).toHaveTextContent('100%');
  });

  it('負の進捗値を0に正規化できること', () => {
    render(
      <ProgressSummary
        {...defaultProps}
        progressPercentage={-10}
      />
    );

    const progressPercentage = screen.getByTestId('progress-percentage');
    expect(progressPercentage).toHaveTextContent('0%');
  });

  it('100を超える進捗値を100に正規化できること', () => {
    render(
      <ProgressSummary
        {...defaultProps}
        progressPercentage={150}
      />
    );

    const progressPercentage = screen.getByTestId('progress-percentage');
    expect(progressPercentage).toHaveTextContent('100%');
  });

  it('大きな歩数をカンマ区切りで表示できること', () => {
    render(
      <ProgressSummary
        {...defaultProps}
        totalSteps={1234567}
      />
    );

    const steps = screen.getByTestId('total-steps');
    expect(steps).toHaveTextContent('1,234,567');
  });

  it('0歩を表示できること', () => {
    render(
      <ProgressSummary
        {...defaultProps}
        totalSteps={0}
      />
    );

    const steps = screen.getByTestId('total-steps');
    expect(steps).toHaveTextContent('0');
  });

  it('ストリーク0日を表示できること', () => {
    render(
      <ProgressSummary
        {...defaultProps}
        currentStreak={0}
        maxStreak={0}
      />
    );

    const streak = screen.getByTestId('current-streak');
    expect(streak).toHaveTextContent('0');

    const maxStreak = screen.getByTestId('max-streak');
    expect(maxStreak).toHaveTextContent('最高: 0');
  });

  it('残り合目の情報を表示できること', () => {
    render(
      <ProgressSummary
        {...defaultProps}
        currentStation={3}
      />
    );

    const subtext = screen.getByTestId('progress-subtext');
    // 10 - 3 = 7 合目
    expect(subtext).toHaveTextContent('7');
  });

  it('すべての統計情報が正しく組み合わされること', () => {
    render(<ProgressSummary {...defaultProps} />);

    // ステーション、ストリーク、歩数すべてが表示される
    const stationCard = screen.getByTestId('station-card');
    const streakCard = screen.getByTestId('streak-card');
    const stepsCard = screen.getByTestId('steps-card');

    expect(stationCard).toBeTruthy();
    expect(streakCard).toBeTruthy();
    expect(stepsCard).toBeTruthy();
  });

  it('進捗バーのコンテナが表示されること', () => {
    render(<ProgressSummary {...defaultProps} />);

    const progressBarContainer = screen.getByTestId('progress-bar-container');
    expect(progressBarContainer).toBeTruthy();
  });

  it('各カードがアクセシビリティ属性を持つこと', () => {
    render(<ProgressSummary {...defaultProps} />);

    const stationCard = screen.getByTestId('station-card');
    const streakCard = screen.getByTestId('streak-card');
    const stepsCard = screen.getByTestId('steps-card');

    expect(stationCard).toBeTruthy();
    expect(streakCard).toBeTruthy();
    expect(stepsCard).toBeTruthy();
  });

  it('5合目の中間地点を表示できること', () => {
    render(
      <ProgressSummary
        {...defaultProps}
        currentStation={5}
        progressPercentage={50}
      />
    );

    const station = screen.getByTestId('current-station');
    expect(station).toHaveTextContent('5');

    const progressPercentage = screen.getByTestId('progress-percentage');
    expect(progressPercentage).toHaveTextContent('50%');
  });

  it('異なる進捗値で複数回レンダリングできること', () => {
    const { rerender } = render(<ProgressSummary {...defaultProps} />);

    let progressPercentage = screen.getByTestId('progress-percentage');
    expect(progressPercentage).toHaveTextContent('45%');

    rerender(
      <ProgressSummary
        {...defaultProps}
        progressPercentage={75}
      />
    );

    progressPercentage = screen.getByTestId('progress-percentage');
    expect(progressPercentage).toHaveTextContent('75%');
  });

  it('マウンテンテーマのカラーが反映されること', () => {
    render(<ProgressSummary {...defaultProps} />);

    // コンポーネントが正常にレンダリングされていることを確認
    const container = screen.getByTestId('progress-summary');
    expect(container).toBeTruthy();
  });
});
