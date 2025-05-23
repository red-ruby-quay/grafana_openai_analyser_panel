import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { PanelProps } from '@grafana/data';
import { SimpleOptions } from 'types';
import { css, cx } from '@emotion/css';
import { LoadingPlaceholder, Spinner, useStyles2 } from '@grafana/ui';
import html2canvas from 'html2canvas';

interface Props extends PanelProps<SimpleOptions> { }

const getStyles = () => {
  return {
    wrapper: css`
      display: flex;
      flex-direction: column;
    `,
    options: css`
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      gap: 10px;
    `,
    selectInput: css`
      min-width: 130px;
      min-height: 25px;
    `,
    checkbox: css`
      margin-right: 10px;
    `,
    outputText: css`
      width: 100%;
      flex: 1;
      overflow-y: auto;

      h3 {
        font-size: 1em;
      }

      ul {
        margin-bottom: 10px;
      }
    `,
    svg: css`
      position: absolute;
      top: 0;
      left: 0;
    `,
    textBox: css`
      position: absolute;
      bottom: 0;
      left: 0;
      padding: 10px;
    `,
  };
};

const analysisOptions: { [key: string]: string } = {
  Summary: `This image shows a Grafana Dashboard of K6 API performance test results. Only focus on the panels on the dashboard. DO NOT INCLUDE the AI Analyser panel in your analysis. Provide a brief summary of what the dashboard is displaying according to k6 performance test stats results, focusing on the most critical and relevant data points. Always start with "This dashboard shows..." and ensure that the summary captures the key insights without going into too much detail.`,
  Insights: `This image shows a Grafana Dashboard of K6 API performance test results. Only focus on the panels on the dashboard. DO NOT INCLUDE the AI Analyser panel in your analysis. Please explain what the data is showing and share any insights you can gather from it's k6 performance test stats results. Always start with "This dashboard shows..." and provide detailed insights into the data presented, highlighting any trends, patterns, or anomalies you observe.`,
  Diagnosis: `This image shows a Grafana Dashboard of K6 API performance test results. Only focus on the panels on the dashboard. DO NOT INCLUDE the AI Analyser panel in your analysis. Please analyze the data for any potential issues or problems, highlighting correlations and any critical points of concern. Always start with "This dashboard shows..." and provide a detailed diagnosis of any potential issues or inefficiencies of particular API performance stats indicated by the data.`,
};

export const SimplePanel: React.FC<Props> = ({ options, data, width, height, fieldConfig, id }) => {
  const styles = useStyles2(getStyles);

  const [buttonText, setButtonText] = useState('Analyse');
  const [buttonEnabled, setButtonEnabled] = useState(true);
  const [selectEnabled, setSelectEnabled] = useState(true);
  const [analysisText, setAnalysisText] = useState('Choose an option and click "Analyse"');
  const [selectedOption, setSelectedOption] = useState('');
  const [prompt, setPrompt] = useState(analysisOptions.Summary);
  const [abortController, setAbortController] = useState<AbortController | null>(null);


  const handleOptionChange = (event: any) => {
    const selected = event.target.value;
    setSelectedOption(selected);
    setPrompt(analysisOptions[selected]);
  };

  const onStopClick = () => {
    if (abortController) {
      abortController.abort();
    }
  };

  const onButtonClick = async () => {
    try {
      setButtonText('Analysing...');
      setButtonEnabled(false);
      setSelectEnabled(false);

      // Create and store a new AbortController for this fetch request.
      const controller = new AbortController();
      setAbortController(controller);

      // Generate text output, adjust logging to "false" if needed
      const canvas = await html2canvas(
        document.body,
        {
          useCORS: true,
          logging: true,
        }
      );

      let imageUrl = canvas.toDataURL('image/png');
      const base64Image = imageUrl.split(',')[1];

      const rawResponse = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'llava:7b-v1.6',
          prompt: prompt,
          images: [base64Image],
          stream: false
        }),
      });

      const rawResponseJSON = await rawResponse.json();
      const parsedResponse = rawResponseJSON.response.trim();
      const parsedDuration = parseFloat((rawResponseJSON.total_duration / 1e9).toFixed(3));

      const responseContent = `#### DURATION:\n**${parsedDuration}** seconds\n\n#### RESPONSE:\n\n${parsedResponse}`;
      setAnalysisText(responseContent);

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Fetch aborted');
        setAnalysisText('Analysis aborted by user.');
      } else {
        console.error(err);
        setAnalysisText(`${err}`);
      }
    } finally {
      setAbortController(null);
      setButtonText('Analyse');
      setButtonEnabled(true);
      setSelectEnabled(true);
    }
  };

  return (
    <div className={cx(styles.wrapper, css`
      width: ${width}px;
      height: ${height}px;
    `)}>
      <div className={cx(styles.options)}>
        <select disabled={!selectEnabled} id="analysisType" value={selectedOption} onChange={handleOptionChange} className={cx(styles.selectInput)}>
          {Object.keys(analysisOptions).map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        {buttonEnabled ? (
          <button onClick={onButtonClick}>
            {buttonText}
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Spinner size="xl" />
            <button onClick={onStopClick}>
              Stop
            </button>
          </div>
        )}
      </div>
      <div className={cx(styles.outputText)}>
        {buttonEnabled ? (
          ''
        ) : (
          <LoadingPlaceholder text="Please wait for a while, it takes a few times..." />
        )}
        {buttonEnabled && (
          <ReactMarkdown>
            {analysisText}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
};
