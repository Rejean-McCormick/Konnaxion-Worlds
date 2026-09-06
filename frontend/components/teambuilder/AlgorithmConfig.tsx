// frontend/components/teambuilder/AlgorithmConfig.tsx
import React from 'react';

import { IAlgorithmConfig } from '@/services/teambuilder/types';

interface AlgorithmConfigProps {
  config: IAlgorithmConfig;
  onChange: (newConfig: IAlgorithmConfig) => void;
  disabled?: boolean;
}

export const AlgorithmConfig: React.FC<AlgorithmConfigProps> = ({
  config,
  onChange,
  disabled = false,
}) => {
  
  const handleChange = <K extends keyof IAlgorithmConfig,>(
    field: K,
    value: IAlgorithmConfig[K],
  ) => {
    onChange({
      ...config,
      [field]: value,
    });
  };

  return (
    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-indigo-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
        Algorithm Settings
      </h3>

      <div className="space-y-6">
        {/* Target Team Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Target Team Size
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={2}
              max={20}
              value={config.target_team_size}
              onChange={(e) =>
                handleChange('target_team_size', parseInt(e.target.value) || 4)
              }
              disabled={disabled}
              className="block w-24 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
            />
            <span className="text-sm text-gray-500">members per team</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            The algorithm will try to keep teams as close to this number as
            possible.
          </p>
        </div>

        <hr className="border-gray-100" />

        {/* Distribution Strategy */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Distribution Strategy
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Random Strategy Card */}
            <div
              onClick={() => !disabled && handleChange('strategy', 'random')}
              className={`
                cursor-pointer rounded-lg border p-4 flex flex-col gap-2 transition-all
                ${
                  config.strategy === 'random'
                    ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                    : 'border-gray-200 hover:border-gray-300'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">True Random</span>
                {config.strategy === 'random' && (
                  <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Shuffles all candidates and assigns them blindly. Good for ice-breakers or pure chance.
              </p>
            </div>

            {/* Balanced Expertise Card */}
            <div
              onClick={() =>
                !disabled && handleChange('strategy', 'balanced_expertise')
              }
              className={`
                cursor-pointer rounded-lg border p-4 flex flex-col gap-2 transition-all
                ${
                  config.strategy === 'balanced_expertise'
                    ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                    : 'border-gray-200 hover:border-gray-300'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">
                  Balanced Expertise
                </span>
                {config.strategy === 'balanced_expertise' && (
                  <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Uses Ekoh scores to distribute experts evenly. Ensures no team is overpowered.
              </p>
            </div>
          </div>
        </div>

        {/* Advanced / Weighting (Visual Only for now, unless backed by logic) */}
        {config.strategy === 'balanced_expertise' && (
          <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-medium text-gray-700">
                Diversity Weight
              </label>
              <span className="text-xs text-gray-500">
                {config.diversity_weight || 0.5}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.diversity_weight || 0.5}
              onChange={(e) =>
                handleChange('diversity_weight', parseFloat(e.target.value))
              }
              disabled={disabled}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Pure Skill</span>
              <span>Mixed Factors</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};